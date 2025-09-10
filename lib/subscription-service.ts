import { prisma } from '@/lib/prisma';
import { SUBSCRIPTION_PLANS, getPlanByWhopProductId, type SubscriptionLimits } from './subscription-plans';

export class SubscriptionService {
  static async getSubscriptionStatus(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        whopSubscriptions: {
          where: { 
            status: 'active',
            validUntil: {
              gt: new Date()
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!tenant?.whopSubscriptions?.[0]) {
      return {
        isActive: false,
        plan: null,
        subscription: null
      };
    }

    const subscription = tenant.whopSubscriptions[0];
    const plan = getPlanByWhopProductId(subscription.whopProductId);

    return {
      isActive: true,
      plan,
      subscription
    };
  }

  static async getCurrentUsage(tenantId: string): Promise<SubscriptionLimits> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    // Get subscription status
    const subscriptionStatus = await this.getSubscriptionStatus(tenantId);
    
    if (!subscriptionStatus.isActive || !subscriptionStatus.plan) {
      // No active subscription - return restrictive limits
      return {
        challengesRemaining: 0,
        challengesUsed: 0,
        challengesLimit: 0,
        participantsLimit: 0,
        canCreateChallenge: false,
        canAddParticipants: () => false
      };
    }

    const plan = subscriptionStatus.plan;

    // Get monthly usage
    let monthlyUsage = await prisma.monthlyUsage.findUnique({
      where: {
        tenantId_month: {
          tenantId,
          month: currentMonth
        }
      }
    });

    // Create monthly usage record if it doesn't exist
    if (!monthlyUsage) {
      monthlyUsage = await prisma.monthlyUsage.create({
        data: {
          tenantId,
          month: currentMonth,
          challengesCreated: 0
        }
      });
    }

    const challengesUsed = monthlyUsage.challengesCreated;
    const challengesLimit = plan.limits.challengesPerMonth;
    const challengesRemaining = challengesLimit === -1 ? -1 : Math.max(0, challengesLimit - challengesUsed);
    const participantsLimit = plan.limits.participantsPerChallenge;

    return {
      challengesRemaining,
      challengesUsed,
      challengesLimit,
      participantsLimit,
      canCreateChallenge: challengesLimit === -1 || challengesUsed < challengesLimit,
      canAddParticipants: (currentCount: number) => 
        participantsLimit === -1 || currentCount < participantsLimit
    };
  }

  static async incrementChallengeUsage(tenantId: string): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    await prisma.monthlyUsage.upsert({
      where: {
        tenantId_month: {
          tenantId,
          month: currentMonth
        }
      },
      update: {
        challengesCreated: {
          increment: 1
        }
      },
      create: {
        tenantId,
        month: currentMonth,
        challengesCreated: 1
      }
    });
  }

  static async checkCanCreateChallenge(tenantId: string): Promise<{ canCreate: boolean; reason?: string }> {
    const limits = await this.getCurrentUsage(tenantId);
    
    if (!limits.canCreateChallenge) {
      if (limits.challengesLimit === 0) {
        return {
          canCreate: false,
          reason: 'No active subscription. Please upgrade to create challenges.'
        };
      } else {
        return {
          canCreate: false,
          reason: `Monthly limit reached. You've used ${limits.challengesUsed}/${limits.challengesLimit} challenges this month.`
        };
      }
    }

    return { canCreate: true };
  }

  static async checkCanAddParticipants(tenantId: string, currentParticipantCount: number): Promise<{ canAdd: boolean; reason?: string }> {
    const limits = await this.getCurrentUsage(tenantId);
    
    if (!limits.canAddParticipants(currentParticipantCount)) {
      return {
        canAdd: false,
        reason: `Participant limit reached. This challenge already has ${currentParticipantCount} participants. Your plan allows up to ${limits.participantsLimit} participants per challenge.`
      };
    }

    return { canAdd: true };
  }
}
