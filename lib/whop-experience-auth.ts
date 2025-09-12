/**
 * 🎯 WHOP EXPERIENCE AUTH SERVICE
 * Implementiert die 10 Whop-Regeln für Experience-basierte Apps
 */
"use server";

import { headers } from "next/headers";
import { whopSdk } from "./whop-sdk";
import { getExperienceContext } from "./whop-experience";
import { prisma } from "./prisma";

// 🎯 WHOP RULE #2: Rollen sauber mappen
export type WhopRole = 'admin' | 'customer' | 'no_access';
export type AppRole = 'ersteller' | 'member' | 'guest';

export interface ExperienceAuth {
  isAuthenticated: boolean;
  userId?: string;
  experienceId?: string;
  whopRole: WhopRole;
  appRole: AppRole;
  hasAccess: boolean;
  permissions: {
    canCreate: boolean;
    canManage: boolean;
    canParticipate: boolean;
    canViewAnalytics: boolean;
  };
}

/**
 * 🎯 WHOP RULE #3: Auth nur auf dem Server
 * Minimal-Flow implementiert
 */
export async function verifyExperienceAuth(requireAccess = true): Promise<ExperienceAuth> {
  try {
    const headersList = await headers();
    
    // Step 1: userId = verifyUserToken(headers)
    const userToken = headersList.get('x-whop-user-token');
    if (!userToken) {
      return createGuestAuth();
    }

    const { userId } = await whopSdk.verifyUserToken(headersList);
    if (!userId) {
      return createGuestAuth();
    }

    // Get Experience context
    const experienceContext = await getExperienceContext();
    if (!experienceContext.experienceId) {
      console.warn('⚠️ No experienceId found - falling back to company-based auth');
      return createGuestAuth();
    }

    // Step 2: result = access.checkIfUserHasAccessToExperience
    const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId: experienceContext.experienceId
    });

    // Step 3: if (!result.hasAccess) -> 403
    if (!accessResult.hasAccess && requireAccess) {
      throw new Error('Access denied to experience');
    }

    // Step 4: Map Whop roles to app roles (RULE #2)
    const whopRole = accessResult.accessLevel as WhopRole;
    const appRole = mapWhopRoleToAppRole(whopRole);

    return {
      isAuthenticated: true,
      userId,
      experienceId: experienceContext.experienceId,
      whopRole,
      appRole,
      hasAccess: accessResult.hasAccess,
      permissions: calculatePermissions(appRole)
    };

  } catch (error) {
    console.error('Experience auth error:', error);
    if (requireAccess) {
      throw error;
    }
    return createGuestAuth();
  }
}

/**
 * 🎯 WHOP RULE #4: UI darf rendern, Logik bleibt Server
 * Für Admin-Aktionen verwenden
 */
export async function requireAdminAccess(): Promise<ExperienceAuth> {
  const auth = await verifyExperienceAuth(true);
  
  // Step 4: if (admin-Action && result.accessLevel !== 'admin') -> 403
  if (auth.whopRole !== 'admin') {
    throw new Error('Admin access required');
  }

  return auth;
}

/**
 * 🎯 WHOP RULE #4: Für Member-Aktionen
 */
export async function requireMemberAccess(): Promise<ExperienceAuth> {
  const auth = await verifyExperienceAuth(true);
  
  if (!['admin', 'customer'].includes(auth.whopRole)) {
    throw new Error('Member access required');
  }

  return auth;
}

// Helper Functions

function createGuestAuth(): ExperienceAuth {
  return {
    isAuthenticated: false,
    whopRole: 'no_access',
    appRole: 'guest',
    hasAccess: false,
    permissions: {
      canCreate: false,
      canManage: false,
      canParticipate: false,
      canViewAnalytics: false
    }
  };
}

/**
 * 🎯 WHOP RULE #2: Rollen sauber mappen
 * ersteller → admin, member → customer, guest → no_access
 */
function mapWhopRoleToAppRole(whopRole: WhopRole): AppRole {
  switch (whopRole) {
    case 'admin':
      return 'ersteller';  // Company Owner/Moderator
    case 'customer':
      return 'member';     // Community Member
    case 'no_access':
    default:
      return 'guest';      // No access
  }
}

/**
 * 🎯 WHOP RULE #10: Sichtbare Rollen in deiner App
 */
function calculatePermissions(appRole: AppRole) {
  switch (appRole) {
    case 'ersteller':
      return {
        canCreate: true,        // darf konfigurieren, moderieren, veröffentlichen
        canManage: true,        // Payouts anstoßen usw.
        canParticipate: true,   // kann auch teilnehmen
        canViewAnalytics: true  // Revenue, Statistics
      };
    case 'member':
      return {
        canCreate: false,       
        canManage: false,       
        canParticipate: true,   // darf konsumieren/teilnehmen
        canViewAnalytics: false 
      };
    case 'guest':
    default:
      return {
        canCreate: false,       
        canManage: false,       
        canParticipate: false,  // nur Public/Lite-Ansichten
        canViewAnalytics: false 
      };
  }
}

/**
 * 🎯 WHOP RULE #1: Experience-scoped data access
 * Wrapper für sichere DB-Zugriffe
 */
export async function withExperienceScope<T>(
  operation: (experienceId: string, auth: ExperienceAuth) => Promise<T>
): Promise<T> {
  const auth = await verifyExperienceAuth(true);
  
  if (!auth.experienceId) {
    throw new Error('Experience context required');
  }

  return operation(auth.experienceId, auth);
}

/**
 * 🎯 WHOP RULE #1: Safe Challenge queries mit Experience scoping
 */
export async function getChallengesForExperience(auth: ExperienceAuth) {
  if (!auth.experienceId) {
    return [];
  }

  return prisma.challenge.findMany({
    where: {
      experienceId: auth.experienceId,  // 🎯 RULE #1: Everything scoped by experienceId
      ...(auth.appRole === 'guest' ? { isPublic: true } : {}) // 🎯 RULE #10: Guests only see public
    },
    include: {
      enrollments: auth.permissions.canManage ? true : {
        where: { 
          user: { 
            whopUserId: auth.userId // Users only see their own participation
          } 
        }
      }
    }
  });
}
