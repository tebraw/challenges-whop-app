"use server";
import { headers } from "next/headers";
import { verifyUserToken, whopSdk, type WhopUser } from "./whop-sdk";

interface WhopAuthUser {
  userId: string;
  user?: WhopUser;
  memberships?: any[];
  companyId?: string;
}

export async function getWhopUserFromHeaders(): Promise<WhopAuthUser | null> {
  const h = await headers();
  
  // Standard Authorization header
  const authHeader = h.get('authorization') || h.get('Authorization') || '';
  
  // Whop Experience App headers (verschiedene mögliche Formate)
  const whopToken = h.get('x-whop-token') || h.get('X-Whop-Token') || '';
  const whopUserId = h.get('x-whop-user-id') || h.get('X-Whop-User-Id') || 
                     h.get('x-user-id') || h.get('X-User-Id') || '';
  const whopCompanyId = h.get('x-whop-company-id') || h.get('X-Whop-Company-Id') || 
                        h.get('x-company-id') || h.get('X-Company-Id') || '';
  const whopMembershipId = h.get('x-whop-membership-id') || h.get('X-Whop-Membership-Id') || 
                           h.get('x-membership-id') || h.get('X-Membership-Id') || '';
  const whopExperienceId = h.get('x-whop-experience-id') || h.get('X-Whop-Experience-Id') || 
                           h.get('x-experience-id') || h.get('X-Experience-Id') || '';
  
  const token = authHeader || whopToken;
  
  console.log('🔍 Experience App headers received:', {
    hasAuth: !!authHeader,
    hasToken: !!whopToken,
    hasUserId: !!whopUserId,
    hasCompanyId: !!whopCompanyId,
    hasMembershipId: !!whopMembershipId,
    hasExperienceId: !!whopExperienceId,
    userId: whopUserId?.slice(-6) || 'none',
    companyId: whopCompanyId?.slice(-6) || 'none'
  });
  
  if (!token && !whopUserId) {
    console.log('❌ No Whop authentication found in headers');
    return null;
  }

  try {
    // Priority 1: Experience App headers (most reliable for iFrame apps)
    if (whopUserId) {
      const result: WhopAuthUser = {
        userId: whopUserId,
        user: {
          id: whopUserId,
          email: `user_${whopUserId.slice(-6)}@whop.com`,
          username: `User_${whopUserId.slice(-6)}`,
          created_at: new Date().toISOString(),
          avatar_url: ''
        },
        companyId: whopCompanyId || undefined,
        memberships: whopMembershipId ? [{ id: whopMembershipId }] : []
      };
      
      console.log('✅ Experience App user detected:', {
        userId: result.userId?.slice(-6),
        companyId: result.companyId?.slice(-6),
        hasMembership: !!whopMembershipId
      });
      return result;
    }
    
    // Fallback to token verification
    const tokenInfo = await verifyUserToken(token);
    
    if (!tokenInfo?.valid || !tokenInfo.userId) {
      console.log('Invalid or expired token');
      return null;
    }

    const result: WhopAuthUser = {
      userId: tokenInfo.userId,
      user: tokenInfo.user as WhopUser
    };

    // If we have a real SDK, fetch user memberships
    if (whopSdk && tokenInfo.user) {
      try {
        const memberships = await whopSdk.getUserMemberships(tokenInfo.user.id);
        result.memberships = memberships;
      } catch (error) {
        console.warn('Could not fetch user memberships:', error);
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting Whop user from headers:', error);
    return null;
  }
}

export async function ensureExperienceAccess(
  experienceId: string, 
  userId?: string
): Promise<{ hasAccess: boolean; reason?: string }> {
  
  if (!whopSdk) {
    console.warn('Whop SDK not available - granting temporary access');
    return { hasAccess: true, reason: 'Development fallback' };
  }

  if (!userId) {
    return { hasAccess: false, reason: 'No user ID provided' };
  }

  try {
    // Get the experience details
    const experience = await whopSdk.getExperience(experienceId);
    
    if (!experience?.product_id) {
      return { hasAccess: false, reason: 'Experience not found' };
    }

    // Get user's memberships for this product
    const memberships = await whopSdk.getUserMemberships(userId);
    
    // Check if user has active membership for this product
    const hasActiveMembership = memberships.some(membership => 
      membership.product_id === experience.product_id && 
      membership.status === 'active'
    );

    if (!hasActiveMembership) {
      return { hasAccess: false, reason: 'No active membership for this product' };
    }

    return { hasAccess: true, reason: 'Active membership verified' };
    
  } catch (error) {
    console.error('Error checking experience access:', error);
    return { hasAccess: false, reason: 'Error verifying access' };
  }
}

export async function getWhopProducts() {
  if (!whopSdk) {
    console.warn('Whop SDK not available - returning empty products');
    return [];
  }

  try {
    return await whopSdk.listProducts();
  } catch (error) {
    console.error('Error fetching Whop products:', error);
    return [];
  }
}

export async function getWhopExperiences(productId?: string) {
  if (!whopSdk) {
    console.warn('Whop SDK not available - returning empty experiences');
    return [];
  }

  try {
    return await whopSdk.listExperiences(productId);
  } catch (error) {
    console.error('Error fetching Whop experiences:', error);
    return [];
  }
}

// Middleware helper for protecting routes
export async function requireWhopAuth() {
  const user = await getWhopUserFromHeaders();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

// Helper to check if user has access to a specific product
export async function hasProductAccess(productId: string, userId?: string): Promise<boolean> {
  if (!whopSdk || !userId) {
    return false;
  }

  try {
    const memberships = await whopSdk.getUserMemberships(userId);
    return memberships.some(membership => 
      membership.product_id === productId && 
      membership.status === 'active'
    );
  } catch (error) {
    console.error('Error checking product access:', error);
    return false;
  }
}
