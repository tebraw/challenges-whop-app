// lib/access-control-client.ts
"use client";

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
 * Client-seitige Version der Access-Control-Funktion
 * Verwendet API-Aufrufe statt direkter Server-Funktionen
 */
export async function getUserAccessLevel(): Promise<AccessControlResult> {
  try {
    const response = await fetch('/api/auth/access-level');
    
    if (!response.ok) {
      // Bei Fehler als Gast behandeln
      return {
        userType: 'guest',
        canCreateChallenges: false,
        canViewAdmin: false,
        canViewMyFeed: false,
        canViewDiscover: true,
      };
    }

    const data = await response.json();
    return data.accessLevel;

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
