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
          // 🔄 Create tenant with REAL Whop data (no test data!)
          tenant = await prisma.tenant.create({
            data: {
              name: company.name || `Company ${company.id}`,
              whopCompanyId: company.id
            }
          });
          console.log(`🆕 Created tenant with REAL data:`, {
            name: tenant.name,
            whopCompanyId: tenant.whopCompanyId,
            availableFields: Object.keys(company)
          });
        }

        // Create or update user for this tenant
        await prisma.user.upsert({
          where: { 
            whopUserId: session.userId 
          },
          update: {
            email: session.email,
            name: session.username || session.email.split('@')[0],
            role: 'ADMIN',
            whopCompanyId: company.id,
            isFreeTier: false,
            tier: 'enterprise'
          },
          create: {
            email: session.email,
            name: session.username || session.email.split('@')[0],
            role: 'ADMIN',
            tenantId: tenant.id,
            whopUserId: session.userId,
            whopCompanyId: company.id,
            isFreeTier: false,
            subscriptionStatus: 'active',
            tier: 'enterprise'
          }
        });

        console.log(`🔑 Company owner ${session.email} granted admin access for ${company.name}`);
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
 * Check if user is the app creator (automatic admin access)
 */
export async function isAppCreator(userId: string): Promise<boolean> {
  try {
    // Method 1: Check if user owns the company we're checking
    const companyResponse = await fetch(`https://api.whop.com/v5/companies/${process.env.NEXT_PUBLIC_WHOP_COMPANY_ID}`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (companyResponse.ok) {
      const company = await companyResponse.json();
      console.log('🔍 Company data:', { 
        id: company.id, 
        owner: company.owner_id || company.owner?.id,
        name: company.name 
      });
      
      // Check if user is the company owner
      if (company.owner_id === userId || company.owner?.id === userId) {
        console.log('✅ User is company owner');
        return true;
      }
    }

    // Method 2: Check user's companies to see if they own the target company
    const userCompaniesResponse = await fetch(`https://api.whop.com/v5/users/${userId}/companies`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (userCompaniesResponse.ok) {
      const userCompanies = await userCompaniesResponse.json();
      console.log('🔍 User companies FULL DATA:', JSON.stringify(userCompanies.data, null, 2));
      console.log('🔍 User companies summary:', userCompanies.data?.map((c: any) => ({ id: c.id, name: c.name, handle: c.handle, username: c.username })));
      
      const ownsTargetCompany = userCompanies.data?.some((company: any) => 
        company.id === process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
      );
      
      if (ownsTargetCompany) {
        console.log('✅ User owns target company');
        return true;
      }
    }

    console.log('❌ User is not company owner');
    return false;
  } catch (error) {
    console.error('Error checking if user is app creator:', error);
    return false;
  }
}

/**
 * Get user role based on Whop membership and creator status
 * MULTI-TENANT: Each company owner is admin of their own company
 */
export async function getUserRole(session: WhopSession): Promise<'ADMIN' | 'USER'> {
  try {
    // MULTI-TENANT APPROACH: Check if user owns ANY company
    // If they own a company, they are admin for that company's challenges
    
    const userCompaniesResponse = await fetch(`https://api.whop.com/v5/users/${session.userId}/companies`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (userCompaniesResponse.ok) {
      const userCompanies = await userCompaniesResponse.json();
      const ownedCompanies = userCompanies.data || [];
      
      console.log('🔍 User owned companies:', ownedCompanies.map((c: any) => ({ id: c.id, name: c.name })));
      
      // If user owns any companies, they are an admin
      if (ownedCompanies.length > 0) {
        console.log('🔑 User owns companies - granting admin access');
        return 'ADMIN';
      }
    }

    // Check if user has memberships (they are a member of communities)
    const hasAnyMembership = session.memberships.some(m => 
      m.valid && m.status === 'active'
    );
    
    if (hasAnyMembership) {
      console.log('🔑 User has valid memberships - user access');
      return 'USER';
    }

    console.log('❌ User has no companies or memberships');
    return 'USER';
  } catch (error) {
    console.error('Error determining user role:', error);
    return 'USER';
  }
}

/**
 * Check if user has access to specific product
 */
export async function hasProductAccess(
  userId: string, 
  productId: string
): Promise<boolean> {
  try {
    const session = await getWhopSession();
    if (!session || session.userId !== userId) {
      return false;
    }

    return session.memberships.some(
      membership => 
        membership.productId === productId && 
        membership.valid && 
        membership.status === 'active'
    );
  } catch (error) {
    console.error('Error checking product access:', error);
    return false;
  }
}

/**
 * Create Whop checkout URL
 * Uses your real Whop app credentials
 */
export async function createWhopCheckout(options: {
  planId: string;
  userId?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    const { planId, successUrl, cancelUrl, metadata } = options;
    
    const response = await fetch('https://api.whop.com/v5/payments/checkout-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Whop-App-Id': process.env.NEXT_PUBLIC_WHOP_APP_ID!
      },
      body: JSON.stringify({
        plan_id: planId,
        company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
        ...(successUrl && { success_url: successUrl }),
        ...(cancelUrl && { cancel_url: cancelUrl }),
        ...(metadata && { metadata })
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whop checkout error:', errorText);
      throw new Error('Failed to create checkout session');
    }

    const session = await response.json();
    return session.checkout_url;
  } catch (error) {
    console.error('Error creating Whop checkout:', error);
    throw error;
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

/**
 * Validate membership for specific product
 */
export async function validateMembership(
  userId: string, 
  productId: string
): Promise<{ valid: boolean; membership?: WhopMembership }> {
  try {
    const session = await getWhopSession();
    if (!session || session.userId !== userId) {
      return { valid: false };
    }

    const membership = session.memberships.find(
      m => m.productId === productId && m.valid && m.status === 'active'
    );

    return {
      valid: !!membership,
      membership
    };
  } catch (error) {
    console.error('Error validating membership:', error);
    return { valid: false };
  }
}
