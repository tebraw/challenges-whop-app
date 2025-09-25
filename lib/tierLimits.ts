import { prisma } from './prisma';

export type AccessTier = 'Basic' | 'Plus' | 'ProPlus';

export interface TierLimits {
  challengesPerMonth: number;
  canCreatePaidChallenges: boolean;
  features: string[];
}

export const TIER_LIMITS: Record<AccessTier, TierLimits> = {
  Basic: {
    challengesPerMonth: 3,
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
 * Check if user can create a new challenge based on their tier limits
 */
export async function canCreateChallenge(
  companyId: string, 
  tenantId: string, 
  accessTier: AccessTier
): Promise<{ allowed: boolean; reason?: string; currentCount?: number; limit?: number }> {
  const limits = TIER_LIMITS[accessTier];
  
  // Plus and ProPlus have unlimited challenges
  if (limits.challengesPerMonth === Infinity) {
    return { allowed: true };
  }
  
  // For Basic tier, check monthly limit
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  try {
    // Count challenges created this month for this tenant/company
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
    
  } catch (error) {
    console.error('Error checking challenge limits:', error);
    // On error, allow the action but log it
    return { allowed: true };
  }
}

/**
 * Check if user can create paid challenges
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