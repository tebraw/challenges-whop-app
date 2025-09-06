"use server";
import { headers } from "next/headers";
import { whopSdk, type WhopUser } from "./whop-sdk";

interface WhopAuthUser {
  userId: string;
  user?: WhopUser;
  memberships?: any[];
}

export async function getWhopUserFromHeaders(): Promise<WhopAuthUser | null> {
  const h = await headers();
  const authHeader = h.get('authorization') || h.get('Authorization') || '';
  
  // Also check for token in x-whop-token header (common in Whop apps)
  const whopToken = h.get('x-whop-token') || '';
  
  const token = authHeader || whopToken;
  
  if (!token) {
    console.log('No authorization token found in headers');
    return null;
  }

  try {
    // Use whopSdk.verifyUserToken directly
    const h = await headers();
    const tokenResult = await whopSdk.verifyUserToken(h);
    
    if (!tokenResult?.valid || !tokenResult.userId) {
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
