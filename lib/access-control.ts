// lib/access-control.ts
import { getCurrentUser } from './auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
 * Bestimmt den Benutzertyp und die Zugriffsrechte
 */
export async function getUserAccessLevel(): Promise<AccessControlResult> {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      // Gast-Benutzer - nur öffentliche Bereiche
      return {
        userType: 'guest',
        canCreateChallenges: false,
        canViewAdmin: false,
        canViewMyFeed: false,
        canViewDiscover: true, // Gäste können Discover sehen
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
 * Überprüft, ob der Benutzer Company Owner ist
 */
export async function isCompanyOwner(): Promise<boolean> {
  const access = await getUserAccessLevel();
  return access.userType === 'company_owner';
}

/**
 * Überprüft, ob der Benutzer Customer ist
 */
export async function isCustomer(): Promise<boolean> {
  const access = await getUserAccessLevel();
  return access.userType === 'customer';
}

/**
 * Wirft einen Fehler, wenn der Benutzer kein Company Owner ist
 */
export async function requireCompanyOwner() {
  const isOwner = await isCompanyOwner();
  if (!isOwner) {
    throw new Error('Company owner access required');
  }
}

/**
 * Überprüft, ob der Benutzer Zugriff auf eine bestimmte Challenge hat
 */
export async function canAccessChallenge(challengeId: string): Promise<boolean> {
  try {
    const access = await getUserAccessLevel();
    
    // Gäste können keine Challenges sehen
    if (access.userType === 'guest') {
      return false;
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        tenant: true,
        creator: true,
      }
    });

    if (!challenge) {
      return false;
    }

    // Company Owner können ihre eigenen Challenges immer sehen
    if (access.userType === 'company_owner' && challenge.creator?.whopCompanyId === access.companyId) {
      return true;
    }

    // Customers können alle öffentlichen Challenges sehen
    if (access.userType === 'customer') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking challenge access:', error);
    return false;
  }
}

/**
 * Filtert Challenges basierend auf Benutzertyp
 */
export async function filterChallengesForUser(challenges: any[]): Promise<any[]> {
  const access = await getUserAccessLevel();
  
  if (access.userType === 'guest') {
    return []; // Gäste sehen keine Challenges
  }
  
  if (access.userType === 'company_owner') {
    // Company Owner sehen alle ihre eigenen Challenges
    return challenges.filter(challenge => 
      challenge.creator?.whopCompanyId === access.companyId
    );
  }
  
  // Customers sehen alle öffentlichen Challenges
  return challenges;
}
