import { headers } from 'next/headers';
import { whopSdk } from './whop-sdk';

interface WhopExperienceAuthResult {
  isAuthenticated: boolean;
  userId?: string;
  experienceId?: string;
  userAccess?: 'guest' | 'member' | 'creator';
  permissions?: {
    canView: boolean;
    canParticipate: boolean;
    canManage: boolean;
  };
}

export async function verifyExperienceAccess(
  experienceId: string
): Promise<WhopExperienceAuthResult> {
  try {
    // Whop Experience Rule 1: Get user token from Whop headers
    const headersList = await headers();
    
    // Whop Experience Rule 2: Verify user token with Whop API
    const tokenResult = await whopSdk.verifyUserToken(headersList);
    
    if (!tokenResult || !tokenResult.userId) {
      return {
        isAuthenticated: false,
        userAccess: 'guest',
        permissions: { canView: false, canParticipate: false, canManage: false }
      };
    }

    const userId = tokenResult.userId;

    // Whop Experience Rule 3: Check if user has access to this Experience
    let hasAccess = false;
    let userRole = 'guest';

    try {
      const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
        userId,
        experienceId
      });
      
      if (accessResult && accessResult.hasAccess) {
        hasAccess = true;
        
        // Map Whop access levels to our app roles
        // Official Whop access levels: 'admin', 'customer', 'no_access'
        if (accessResult.accessLevel === 'admin') {
          userRole = 'creator'; // Admin = Creator/Manager
        } else if (accessResult.accessLevel === 'customer') {
          userRole = 'member'; // Customer = Paying member
        } else {
          userRole = 'guest'; // no_access or undefined = Guest
        }
      }
    } catch (error) {
      console.log('Error checking experience access:', error);
      // If experience check fails, fall back to any authentication as guest
      hasAccess = false;
      userRole = 'guest';
    }

    // Whop Experience Rule 4: Map access to permissions
    let userAccess: 'guest' | 'member' | 'creator' = userRole as 'guest' | 'member' | 'creator';
    let permissions = { canView: false, canParticipate: false, canManage: false };

    if (userAccess === 'creator') {
      // Rule 5: Creator permissions - full access
      permissions = { canView: true, canParticipate: true, canManage: true };
    } else if (userAccess === 'member' && hasAccess) {
      // Rule 6: Member permissions - can view and participate
      permissions = { canView: true, canParticipate: true, canManage: false };
    } else {
      // Rule 7: Guest permissions - limited access
      userAccess = 'guest';
      permissions = { canView: true, canParticipate: false, canManage: false };
    }

    return {
      isAuthenticated: true,
      userId,
      experienceId,
      userAccess,
      permissions
    };

  } catch (error) {
    console.error('Experience auth error:', error);
    return {
      isAuthenticated: false,
      userAccess: 'guest',
      permissions: { canView: false, canParticipate: false, canManage: false }
    };
  }
}

// Middleware helper to verify Experience access
export async function requireExperienceAccess(
  experienceId: string,
  requiredAccess: 'guest' | 'member' | 'creator' = 'member'
) {
  const auth = await verifyExperienceAccess(experienceId);
  
  if (!auth.isAuthenticated) {
    throw new Error('Authentication required');
  }

  const accessLevels = { guest: 0, member: 1, creator: 2 };
  
  if (accessLevels[auth.userAccess || 'guest'] < accessLevels[requiredAccess]) {
    throw new Error(`Access denied. Required: ${requiredAccess}, Current: ${auth.userAccess}`);
  }

  return auth;
}

// Get current Experience ID from headers or environment
export async function getCurrentExperienceId(): Promise<string | null> {
  const headersList = await headers();
  
  // Try various Whop headers first (following existing app pattern)
  let experienceId = headersList.get('x-whop-experience-id') ||
                    headersList.get('X-Whop-Experience-Id') ||
                    headersList.get('x-experience-id');
  
  if (!experienceId) {
    // Fallback to environment variable for development
    experienceId = process.env.NEXT_PUBLIC_WHOP_EXPERIENCE_ID || null;
  }
  
  return experienceId;
}

// Combined function for most common use case
export async function verifyCurrentExperienceAccess() {
  const experienceId = await getCurrentExperienceId();
  
  if (!experienceId) {
    // In development mode, allow fallback but warn
    console.warn('No Experience ID found in headers or environment');
    
    // Try to authenticate user anyway for development
    const headersList = await headers();
    const tokenResult = await whopSdk.verifyUserToken(headersList).catch(() => null);
    
    if (tokenResult?.userId) {
      return {
        isAuthenticated: true,
        userId: tokenResult.userId,
        experienceId: 'dev-fallback',
        userAccess: 'member' as const,
        permissions: { canView: true, canParticipate: true, canManage: false }
      };
    }
    
    throw new Error('No Experience ID found and authentication failed');
  }
  
  return verifyExperienceAccess(experienceId);
}

// Utility function to get Experience-scoped data filter
export async function getExperienceDataFilter() {
  const auth = await verifyCurrentExperienceAccess();
  
  return {
    experienceId: auth.experienceId,
    userId: auth.userId,
    canAccess: auth.permissions?.canView || false
  };
}
