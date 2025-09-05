// lib/whop/auth.ts
// Official Whop Integration for Next.js Apps

import { cookies } from 'next/headers';

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
