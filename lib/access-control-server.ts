// lib/access-control-server.ts
import { getCurrentUser } from './auth';

export type UserType = 'customer' | 'company_owner' | 'guest';

export interface AccessControlResult {
  userType: UserType;
  canCreateChallenges: boolean;
  canViewAdmin: boolean;
  canViewMyFeed: boolean;
  canViewDiscover: boolean;
  userId?: string;
  companyId?: string;
}

/**
 * Server-seitige Version der Access-Control-Funktion
 */
export async function getUserAccessLevelServer(): Promise<AccessControlResult> {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      // Gast-Benutzer - nur öffentliche Bereiche
      return {
        userType: 'guest',
        canCreateChallenges: false,
        canViewAdmin: false,
        canViewMyFeed: false,
        canViewDiscover: true,
      };
    }

    // Company Owner = ADMIN Rolle + hat whopCompanyId
    if (currentUser.role === 'ADMIN' && currentUser.whopCompanyId) {
      return {
        userType: 'company_owner',
        canCreateChallenges: true,
        canViewAdmin: true,
        canViewMyFeed: true,
        canViewDiscover: true,
        userId: currentUser.id,
        companyId: currentUser.whopCompanyId,
      };
    }

    // Customer = USER Rolle oder ADMIN ohne Company ID
    return {
      userType: 'customer',
      canCreateChallenges: false,
      canViewAdmin: false,
      canViewMyFeed: true,
      canViewDiscover: true,
      userId: currentUser.id,
      companyId: currentUser.whopCompanyId || undefined,
    };

  } catch (error) {
    console.error('Error determining user access level:', error);
    // Bei Fehler als Gast behandeln
    return {
      userType: 'guest',
      canCreateChallenges: false,
      canViewAdmin: false,
      canViewMyFeed: false,
      canViewDiscover: true,
    };
  }
}

/**
 * Überprüft, ob der Benutzer Company Owner ist (server-seitig)
 */
export async function isCompanyOwnerServer(): Promise<boolean> {
  const access = await getUserAccessLevelServer();
  return access.userType === 'company_owner';
}
