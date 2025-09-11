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
 */
export async function hasActiveSubscription(session: WhopSession): Promise<{
  hasSubscription: boolean;
  plan: 'basic' | 'pro' | null;
  productId?: string;
}> {
  try {
    const basicProductId = 'prod_YByUE3J5oT4Fq';
    const proProductId = 'prod_Tj4T1U7pVwtgb';
    
    // Check for Pro subscription first (higher tier)
    const proSubscription = session.memberships.find(m => 
      m.productId === proProductId && m.valid && m.status === 'active'
    );
    
    if (proSubscription) {
      return {
        hasSubscription: true,
        plan: 'pro',
        productId: proProductId
      };
    }
    
    // Check for Basic subscription
    const basicSubscription = session.memberships.find(m => 
      m.productId === basicProductId && m.valid && m.status === 'active'
    );
    
    if (basicSubscription) {
      return {
        hasSubscription: true,
        plan: 'basic',
        productId: basicProductId
      };
    }
    
    return {
      hasSubscription: false,
      plan: null
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
    // Get user's owned companies to create tenants
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

    // If user owns companies, create/update tenant for each
    if (userCompanies.length > 0) {
      for (const company of userCompanies) {
        console.log('🔍 REAL COMPANY DATA FROM WHOP API:', JSON.stringify(company, null, 2));
        
        // Get or create tenant for this company
        let tenant = await prisma.tenant.findFirst({
          where: { whopCompanyId: company.id }
        });
        
        if (!tenant) {
          // Create tenant with basic company data
          tenant = await prisma.tenant.create({
            data: {
              name: company.name || `Company ${company.id}`,
              whopCompanyId: company.id
            }
          });
          console.log(`🆕 Created tenant:`, {
            name: tenant.name,
            whopCompanyId: tenant.whopCompanyId
          });
        }

        // Create or update user for this tenant
        // PAY-TO-CREATE: Company owners start as USER until they purchase subscription
        if (tenant) {
          await prisma.user.upsert({
            where: { 
              whopUserId: session.userId 
            },
            update: {
              email: session.email,
              name: session.username || session.email.split('@')[0],
              role: 'USER', // Start as USER - will become ADMIN after subscription
              whopCompanyId: company.id,
              isFreeTier: true, // Until they pay
              tier: 'basic'
            },
            create: {
              email: session.email,
              name: session.username || session.email.split('@')[0],
              role: 'USER', // Start as USER - will become ADMIN after subscription
              tenantId: tenant.id,
              whopUserId: session.userId,
              whopCompanyId: company.id,
              isFreeTier: true, // Until they pay
              subscriptionStatus: 'inactive', // Until they pay
              tier: 'basic'
            }
          });

          console.log(`� Company owner ${session.email} created as USER - needs to purchase access pass for admin rights`);
        }
      }
    } else {
      // Fallback: Create default tenant if no companies found
      let tenant = await prisma.tenant.findFirst();
      
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: 'Default Organization'
          }
        });
      }

      await prisma.user.upsert({
        where: { 
          whopUserId: session.userId 
        },
        update: {
          email: session.email,
          name: session.username || session.email.split('@')[0],
          role: 'USER',
          isFreeTier: true,
          tier: 'basic'
        },
        create: {
          email: session.email,
          name: session.username || session.email.split('@')[0],
          role: 'USER',
          tenantId: tenant.id,
          whopUserId: session.userId,
          isFreeTier: true,
          subscriptionStatus: 'active',
          tier: 'basic'
        }
      });
    }

  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  }
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

    // Check if user has PAID for access (active membership/subscription)
    const hasActiveSubscription = session.memberships.some(m => 
      m.valid && m.status === 'active'
    );
    
    console.log('💰 Subscription check:', {
      ownsCompanies,
      hasActiveSubscription,
      memberships: session.memberships.length
    });

    // ADMIN ACCESS: Requires BOTH company ownership AND paid subscription
    if (ownsCompanies && hasActiveSubscription) {
      console.log('🔑 Company owner WITH subscription - granting ADMIN access');
      return 'ADMIN';
    }
    
    // USER ACCESS: Has subscription but no companies (regular member)
    if (hasActiveSubscription) {
      console.log('🔑 User has paid subscription - granting USER access');
      return 'USER';
    }
    
    // NO ACCESS: Company owner without subscription
    if (ownsCompanies && !hasActiveSubscription) {
      console.log('� Company owner needs to purchase access pass for admin rights');
      return 'USER';
    }

    console.log('❌ User has no subscription - no access');
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