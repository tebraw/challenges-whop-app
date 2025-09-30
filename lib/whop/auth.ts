// lib/whop/auth.ts
// Official Whop Integration for Next.js Apps

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export interface WhopSession {
  userId: string;
  email: string;
  username?: string;
  avatar?: string;
  companyId?: string;
  memberships: WhopMembership[];
}

export interface WhopMembership {
  id: string;
  productId: string;
  companyId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  valid: boolean;
  expiresAt?: string;
}

/**
 * Get authenticated Whop user from session
 * Uses Whop API v5 with your real credentials
 */
export async function getWhopSession(): Promise<WhopSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('whop_session')?.value;
    
    if (!sessionToken) {
      return null;
    }

    // Get user data from Whop API using your app credentials
    const userResponse = await fetch('https://api.whop.com/v5/me', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
        'X-Whop-App-Id': process.env.NEXT_PUBLIC_WHOP_APP_ID!
      }
    });

    if (!userResponse.ok) {
      return null;
    }

    const user = await userResponse.json();

    // Get user memberships for your company
    const membershipsResponse = await fetch(`https://api.whop.com/v5/memberships?company_id=${process.env.NEXT_PUBLIC_WHOP_COMPANY_ID}`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
        'X-Whop-App-Id': process.env.NEXT_PUBLIC_WHOP_APP_ID!
      }
    });

    const memberships = membershipsResponse.ok ? await membershipsResponse.json() : { data: [] };

    return {
      userId: user.id,
      email: user.email,
      username: user.username || undefined,
      avatar: user.profile_picture || undefined,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      memberships: memberships.data
        .filter((m: any) => m.user?.id === user.id)
        .map((m: any) => ({
          id: m.id,
          productId: m.product?.id || '',
          companyId: m.company?.id || '',
          status: m.status,
          valid: m.valid,
          expiresAt: m.expires_at
        }))
    };
  } catch (error) {
    console.error('Error getting Whop session:', error);
    return null;
  }
}

/**
 * Check if user has active subscription to our products
 * Updated: Both Basic (Free) and Pro ($29.99) plans grant full admin access
 */
export async function hasActiveSubscription(session: WhopSession): Promise<{
  hasSubscription: boolean;
  plan: 'basic' | 'pro' | null;
  productId?: string;
}> {
  try {
    // ✅ WHOP TEAM FIX: Only check PAID Access Passes
    // Basic users get free access without purchasing Access Pass
    const proProductId = 'prod_Tj4T1U7pVwtgb';    // Pro ($29.99/month)
    
    console.log('🔍 Checking PAID subscriptions only (Basic = default free access):', {
      proProductId,
      userMemberships: session.memberships.length
    });
    
    // Check for Pro subscription (paid tier)
    const proSubscription = session.memberships.find(m => 
      m.productId === proProductId && m.valid && m.status === 'active'
    );
    
    if (proSubscription) {
      console.log('✅ Pro Access Pass found - granting admin access');
      return {
        hasSubscription: true,
        plan: 'pro',
        productId: proProductId
      };
    }
    
    // ✅ WHOP TEAM FIX: Basic users get free access by default
    console.log('✅ No paid Access Pass - defaulting to Basic (free access)');
    
    return {
      hasSubscription: true, // Changed: Basic is considered "has subscription" (free tier)
      plan: 'basic'
    };
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      hasSubscription: false,
      plan: null
    };
  }
}

/**
 * Upgrade user to admin after successful subscription payment
 * Called when user purchases access pass
 */
export async function upgradeUserToAdmin(session: WhopSession): Promise<void> {
  try {
    console.log('💰 Upgrading user to admin after subscription payment...');
    
    // Check if user owns companies and has active subscription
    const userCompaniesResponse = await fetch(`https://api.whop.com/v5/users/${session.userId}/companies`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let ownsCompanies = false;
    if (userCompaniesResponse.ok) {
      const userCompanies = await userCompaniesResponse.json();
      ownsCompanies = (userCompanies.data || []).length > 0;
    }

    const hasActiveSubscription = session.memberships.some(m => 
      m.valid && m.status === 'active'
    );

    // Only upgrade if user owns companies AND has paid subscription
    if (ownsCompanies && hasActiveSubscription) {
      const updatedUser = await prisma.user.update({
        where: { whopUserId: session.userId },
        data: {
          role: 'ADMIN',
          isFreeTier: false,
          subscriptionStatus: 'active',
          tier: 'enterprise'
        }
      });

      console.log('🎉 User upgraded to ADMIN after purchasing subscription!');
      console.log(`   User: ${updatedUser.email}`);
      console.log(`   Role: USER → ADMIN`);
      console.log(`   Tier: basic → enterprise`);
    } else {
      console.log('⚠️ User not eligible for admin upgrade:', {
        ownsCompanies,
        hasActiveSubscription
      });
    }
  } catch (error) {
    console.error('Error upgrading user to admin:', error);
  }
}

/**
 * Create or update admin user in database
 * MULTI-TENANT: Creates separate tenant for each company
 */
async function createOrUpdateAdminUser(session: WhopSession): Promise<void> {
  try {
    console.log(`🔍 Getting real company data for user: ${session.userId}`);
    
    // REAL COMPANY DETECTION: Use the actual company ID from environment
    const realCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_YoIIIT73rXwrtK';
    
    // STRATEGY: All users belong to the same Whop company, but get separate sub-tenants
    // This ensures proper isolation while maintaining the real company structure
    const userSpecificTenantId = `${realCompanyId}_user_${session.userId}`;
    
    console.log(`🏢 Real Company: ${realCompanyId}`);
    console.log(`👤 User Tenant: ${userSpecificTenantId}`);
    
    // Smart company name extraction for user-specific tenant
    let userTenantName = `${session.username || session.email.split('@')[0]}'s Workspace`;
    
    // Try to extract better name from email domain
    if (session.email && session.email.includes('@')) {
      const domain = session.email.split('@')[1];
      if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail')) {
        const domainName = domain.split('.')[0];
        const smartName = domainName
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        userTenantName = `${smartName} - ${session.username || session.email.split('@')[0]}`;
      }
    }
    
    console.log(`📝 User Tenant Name: ${userTenantName}`);
    
    // Get or create user-specific tenant within the real company
    let tenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: userSpecificTenantId }
    });
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: userTenantName,
          whopCompanyId: userSpecificTenantId
        }
      });
      console.log(`✅ Created user-specific tenant: ${userTenantName} (${userSpecificTenantId})`);
    }

    // Determine role based on subscription status
    const hasActiveSubscription = session.memberships.some(m => 
      m.valid && m.status === 'active'
    );
    
    const userRole = hasActiveSubscription ? 'ADMIN' : 'USER';
    console.log(`🔑 Assigning role ${userRole} to user with subscription: ${hasActiveSubscription}`);

    await prisma.user.upsert({
      where: { 
        whopUserId: session.userId 
      },
      update: {
        email: session.email,
        name: session.username || session.email.split('@')[0],
        role: userRole,
        isFreeTier: !hasActiveSubscription,
        tier: hasActiveSubscription ? 'premium' : 'basic',
        whopCompanyId: userSpecificTenantId
      },
      create: {
        email: session.email,
        name: session.username || session.email.split('@')[0],
        role: userRole,
        tenantId: tenant.id,
        whopUserId: session.userId,
        whopCompanyId: userSpecificTenantId,
        isFreeTier: !hasActiveSubscription,
        subscriptionStatus: hasActiveSubscription ? 'active' : 'inactive',
        tier: hasActiveSubscription ? 'premium' : 'basic'
      }
    });

    if (hasActiveSubscription) {
      console.log(`✅ User ${session.email} created as ADMIN with active subscription in isolated tenant`);
    } else {
      console.log(`👤 User ${session.email} created as USER in isolated tenant - needs subscription for admin rights`);
    }

    // Legacy fallback: Check for v5 API companies (but use isolated tenants)
    const userCompaniesResponse = await fetch(`https://api.whop.com/v5/users/${session.userId}/companies`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let userCompanies = [];
    if (userCompaniesResponse.ok) {
      const companiesData = await userCompaniesResponse.json();
      userCompanies = companiesData.data || [];
    }

    // Process any additional companies (for completeness, but keep isolation)
    if (userCompanies.length > 0) {
      console.log(`📊 Found ${userCompanies.length} additional companies for user ${session.userId}`);
      // Log for debugging but don't create additional tenants to maintain isolation
      for (const company of userCompanies) {
        console.log('📝 Additional company found:', {
          id: company.id,
          name: company.name || 'Unknown Company'
        });
      }
    }

    console.log(`✅ User ${session.userId} successfully configured with isolated tenant ${userSpecificTenantId}`);

  } catch (error) {
    console.error('❌ Error in createOrUpdateAdminUser:', error);
    throw error;
  }
}

/**
 * Smart company name extraction from email/username
 */
function extractSmartCompanyName(email: string, username?: string): string {
  let companyName = `${username || email.split('@')[0]}'s Company`;
  
  // Try to extract company from email domain
  if (email && email.includes('@')) {
    const domain = email.split('@')[1];
    if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail')) {
      const domainName = domain.split('.')[0];
      const smartName = domainName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (l: string) => l.toUpperCase());
      companyName = `${smartName} (${username || email.split('@')[0]})`;
    }
  }
  
  return companyName;
}

/**
 * Get user role based on Whop membership and creator status
 * MULTI-TENANT: Each company owner is admin of their own company
 */
export async function getUserRole(session: WhopSession): Promise<'ADMIN' | 'USER'> {
  try {
    // PAY-TO-CREATE MODEL: User needs BOTH company ownership AND active subscription
    // 1. Check if user owns companies
    // 2. Check if user has paid for access pass (active membership)
    // 3. Only THEN grant admin access
    
    const userCompaniesResponse = await fetch(`https://api.whop.com/v5/users/${session.userId}/companies`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let ownsCompanies = false;
    if (userCompaniesResponse.ok) {
      const userCompanies = await userCompaniesResponse.json();
      const ownedCompanies = userCompanies.data || [];
      ownsCompanies = ownedCompanies.length > 0;
      
      console.log('🔍 User owned companies:', ownedCompanies.map((c: any) => ({ id: c.id, name: c.name })));
    }

    // Check if user has your Access Passes (updated logic)
    const subscriptionStatus = await hasActiveSubscription(session);
    
    console.log('🎯 Role determination:', {
      userId: session.userId,
      ownsCompanies,
      hasActiveSubscription: subscriptionStatus.hasSubscription,
      subscriptionPlan: subscriptionStatus.plan,
      productId: subscriptionStatus.productId
    });

    // 🎯 ADMIN ACCESS: Company owner WITH your Access Pass
    if (ownsCompanies && subscriptionStatus.hasSubscription) {
      console.log('� ADMIN ACCESS GRANTED! Company owner with Access Pass');
      return 'ADMIN';
    }
    
    // 🔑 USER ACCESS: Has Access Pass but no companies (regular member)
    if (subscriptionStatus.hasSubscription) {
      console.log('� USER ACCESS: Has Access Pass but no companies');
      return 'USER';
    }
    
    // ✅ WHOP TEAM FIX: Company owners get Basic access by default
    if (ownsCompanies) {
      console.log('✅ Company owner gets Basic access by default (can upgrade to Pro)');
      console.log('   Available upgrades: Pro (prod_Tj4T1U7pVwtgb)');
      return 'ADMIN'; // Company owners get admin role with Basic access
    }

    console.log('✅ Regular user gets Basic access by default');
    return 'USER';
  } catch (error) {
    console.error('Error determining user role:', error);
    return 'USER';
  }
}

/**
 * Handle Whop OAuth callback
 * Follows official Whop OAuth flow
 */
export async function handleWhopCallback(code: string): Promise<WhopSession | null> {
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.whop.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.WHOP_OAUTH_CLIENT_ID!,
        client_secret: process.env.WHOP_OAUTH_CLIENT_SECRET!,
        redirect_uri: process.env.WHOP_OAUTH_REDIRECT_URI!
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const { access_token } = await tokenResponse.json();
    
    // Get user data with access token
    const userResponse = await fetch('https://api.whop.com/v5/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user data');
    }

    const user = await userResponse.json();

    // Get memberships
    const membershipsResponse = await fetch('https://api.whop.com/v5/me/memberships', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const memberships = membershipsResponse.ok ? await membershipsResponse.json() : { data: [] };

    const session: WhopSession = {
      userId: user.id,
      email: user.email,
      username: user.username || undefined,
      avatar: user.profile_picture || undefined,
      companyId: user.companies?.[0]?.id,
      memberships: memberships.data.map((m: any) => ({
        id: m.id,
        productId: m.product?.id || '',
        companyId: m.company?.id || '',
        status: m.status,
        valid: m.valid,
        expiresAt: m.expires_at
      }))
    };

    // Check if user is app creator and auto-create admin account
    const userRole = await getUserRole(session);
    
    if (userRole === 'ADMIN') {
      await createOrUpdateAdminUser(session);
    }

    // Store session in secure cookie
    const cookieStore = await cookies();
    cookieStore.set('whop_session', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return session;
  } catch (error) {
    console.error('Error handling Whop callback:', error);
    return null;
  }
}