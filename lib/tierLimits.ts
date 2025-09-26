import { prisma } from './prisma';

export type AccessTier = 'Basic' | 'Plus' | 'ProPlus';

export interface TierLimits {
  challengesPerMonth: number;
  challengesLifetime?: number; // For Basic tier: 1 challenge total (not per month)
  canCreatePaidChallenges: boolean;
  features: string[];
}

export const TIER_LIMITS: Record<AccessTier, TierLimits> = {
  Basic: {
    challengesPerMonth: Infinity, // Not used for Basic - we use challengesLifetime instead
    challengesLifetime: 1, // 1 challenge total for lifetime
    canCreatePaidChallenges: false,
    features: ['Basic analytics', 'Email support', 'Community access']
  },
  Plus: {
    challengesPerMonth: Infinity,
    canCreatePaidChallenges: false,
    features: ['Advanced analytics', 'Priority support', 'Custom branding', 'Member tools']
  },
  ProPlus: {
    challengesPerMonth: Infinity,
    canCreatePaidChallenges: true,
    features: ['Everything in Plus', 'White-label', 'API access', 'Dedicated support', 'Revenue sharing', 'Paid challenges']
  }
};

/**
 * Check if testing mode is enabled for this company
 */
function isTestingMode(companyId: string): boolean {
  const testingMode = process.env.TESTING_MODE === 'true';
  const testCompanyId = process.env.TEST_COMPANY_ID;
  
  if (testingMode && testCompanyId && companyId === testCompanyId) {
    console.log('🧪 TESTING MODE: Granting ProPlus permissions for company:', companyId);
    return true;
  }
  
  return false;
}

/**
 * Check if user can create a new challenge based on their tier limits
 */
export async function canCreateChallenge(
  companyId: string, 
  tenantId: string, 
  accessTier: AccessTier
): Promise<{ allowed: boolean; reason?: string; currentCount?: number; limit?: number }> {
  // Check testing mode first
  if (isTestingMode(companyId)) {
    console.log('🧪 TESTING MODE: Allowing unlimited challenges for test company');
    return { allowed: true };
  }
  
  const limits = TIER_LIMITS[accessTier];
  
  // Plus and ProPlus have unlimited challenges
  if (limits.challengesPerMonth === Infinity && !limits.challengesLifetime) {
    return { allowed: true };
  }
  
  try {
    if (accessTier === 'Basic') {
      // For Basic tier, check lifetime limit (total challenges ever created)
      const totalChallenges = await prisma.challenge.count({
        where: {
          tenantId: tenantId
        }
      });
      
      console.log(`🔍 Challenge limit check for ${accessTier} (lifetime):`, {
        companyId,
        tenantId,
        currentCount: totalChallenges,
        limit: limits.challengesLifetime,
        allowed: totalChallenges < (limits.challengesLifetime || 1)
      });
      
      if (totalChallenges >= (limits.challengesLifetime || 1)) {
        return {
          allowed: false,
          reason: `You've used your free challenge. Upgrade to Plus for unlimited challenges.`,
          currentCount: totalChallenges,
          limit: limits.challengesLifetime || 1
        };
      }
      
      return {
        allowed: true,
        currentCount: totalChallenges,
        limit: limits.challengesLifetime || 1
      };
    } else {
      // For other tiers, check monthly limit (legacy logic, but shouldn't be used since they have Infinity)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      const challengesThisMonth = await prisma.challenge.count({
        where: {
          tenantId: tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });
      
      console.log(`🔍 Challenge limit check for ${accessTier}:`, {
        companyId,
        tenantId,
        month: `${now.getFullYear()}-${now.getMonth() + 1}`,
        currentCount: challengesThisMonth,
        limit: limits.challengesPerMonth,
        allowed: challengesThisMonth < limits.challengesPerMonth
      });
      
      if (challengesThisMonth >= limits.challengesPerMonth) {
        return {
          allowed: false,
          reason: `You've reached your monthly limit of ${limits.challengesPerMonth} challenges. Upgrade to Plus for unlimited challenges.`,
          currentCount: challengesThisMonth,
          limit: limits.challengesPerMonth
        };
      }
      
      return {
        allowed: true,
        currentCount: challengesThisMonth,
        limit: limits.challengesPerMonth
      };
    }
    
  } catch (error) {
    console.error('Error checking challenge limits:', error);
    // On error, allow the action but log it
    return { allowed: true };
  }
}

/**
 * Check if user can create paid challenges (entry fee system)
 */
export function canCreatePaidChallenges(companyId: string, accessTier: AccessTier): boolean {
  // Check testing mode first
  if (isTestingMode(companyId)) {
    console.log('🧪 TESTING MODE: Allowing paid challenges for test company');
    return true;
  }
  
  // Normal tier check
  return TIER_LIMITS[accessTier].canCreatePaidChallenges;
}

/**
 * Check if user can create paid challenges (legacy function)
 */
export function canCreatePaidChallenge(accessTier: AccessTier): boolean {
  return TIER_LIMITS[accessTier].canCreatePaidChallenges;
}

/**
 * Get tier limits for UI display
 */
export function getTierLimits(accessTier: AccessTier): TierLimits {
  return TIER_LIMITS[accessTier];
}