import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserProgress {
  userId: string;
  challengeId: string;
  completionRate: number;
  engagementScore: number;
  isHighEngagement: boolean;
  daysSinceStart: number;
  streakCount: number;
}

interface PremiumOffer {
  id: string;
  type: 'milestone' | 'completion' | 'engagement';
  title: string;
  description: string;
  discount: number;
  originalPrice: number;
  discountPrice: number;
  urgency: string;
  targetSegment: string;
}

/**
 * Calculates user progress and determines if they are eligible for premium offers
 */
export async function calculateUserProgress(
  userId: string, 
  challengeId: string
): Promise<UserProgress | null> {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId
        }
      },
      include: {
        checkins: {
          orderBy: { createdAt: 'desc' }
        },
        challenge: {
          select: {
            startAt: true,
            endAt: true
          }
        }
      }
    });

    if (!enrollment) {
      return null;
    }

    const challenge = enrollment.challenge;
    const checkins = enrollment.checkins;
    const totalDays = Math.ceil(
      (new Date(challenge.endAt).getTime() - new Date(challenge.startAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceStart = Math.ceil(
      (new Date().getTime() - new Date(challenge.startAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const completionRate = totalDays > 0 ? Math.min((checkins.length / Math.min(daysSinceStart, totalDays)) * 100, 100) : 0;
    
    // Calculate engagement score based on consistency and recent activity
    const recentCheckins = checkins.filter(c => 
      new Date(c.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;
    
    const consistencyScore = totalDays > 0 ? (checkins.length / Math.min(daysSinceStart, totalDays)) * 5 : 0;
    const recentActivityScore = Math.min(recentCheckins * 0.7, 5);
    const engagementScore = Math.min(consistencyScore + recentActivityScore, 10);
    
    // Calculate streak
    let streakCount = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      
      const hasCheckin = checkins.some(c => {
        const checkinDate = new Date(c.createdAt);
        checkinDate.setHours(0, 0, 0, 0);
        return checkinDate.getTime() === checkDate.getTime();
      });
      
      if (hasCheckin) {
        streakCount++;
      } else {
        break;
      }
    }

    return {
      userId,
      challengeId,
      completionRate: Math.round(completionRate),
      engagementScore: Math.round(engagementScore * 10) / 10,
      isHighEngagement: engagementScore >= 7,
      daysSinceStart,
      streakCount
    };
  } catch (error) {
    console.error('Error calculating user progress:', error);
    return null;
  }
}

/**
 * Determines the best premium offer for a user based on their progress and engagement
 */
export function getPremiumOffer(progress: UserProgress): PremiumOffer | null {
  // 75% completion + high engagement = Premium offer
  if (progress.completionRate >= 75 && 
      progress.completionRate < 90 && 
      progress.isHighEngagement) {
    return {
      id: 'premium-75-percent',
      type: 'milestone',
      title: '🎯 Nur für dich! 30% Rabatt auf Premium-Trainingsplan',
      description: 'Du bist kurz vor dem Ziel! Sichere dir jetzt deinen Premium-Trainingsplan mit exklusivem Rabatt.',
      discount: 30,
      originalPrice: 97,
      discountPrice: 67,
      urgency: '⏰ Nur verfügbar für die letzten 25% deiner Challenge!',
      targetSegment: 'high-engagement-near-completion'
    };
  }

  // High engagement but earlier in challenge
  if (progress.completionRate >= 50 && 
      progress.completionRate < 75 && 
      progress.isHighEngagement) {
    return {
      id: 'engagement-50-percent',
      type: 'engagement',
      title: '⚡ VIP-Angebot für Top-Performer',
      description: 'Du zeigst außergewöhnliches Engagement! Hol dir 20% Rabatt auf unseren Premium-Plan.',
      discount: 20,
      originalPrice: 97,
      discountPrice: 77,
      urgency: '🔥 Begrenzt auf die aktivsten 10% der Teilnehmer',
      targetSegment: 'high-engagement-mid-challenge'
    };
  }

  // Completion bonus
  if (progress.completionRate >= 90) {
    return {
      id: 'completion-bonus',
      type: 'completion',
      title: '🏆 Glückwunsch! Completion Bonus',
      description: 'Du hast es fast geschafft! Belohne dich mit unserem Premium-Plan.',
      discount: 35,
      originalPrice: 97,
      discountPrice: 63,
      urgency: '🎉 Verfügbar für 48 Stunden nach Challenge-Abschluss',
      targetSegment: 'completion-reward'
    };
  }

  return null;
}

/**
 * Tracks premium offer interactions for analytics and revenue calculation
 */
export async function trackOfferInteraction(
  challengeId: string,
  userId: string,
  offerId: string,
  action: 'view' | 'click' | 'conversion',
  revenue?: number
): Promise<void> {
  try {
    // In a production app, store this in a dedicated analytics table
    console.log('Premium Offer Interaction:', {
      challengeId,
      userId,
      offerId,
      action,
      revenue,
      timestamp: new Date().toISOString()
    });

    // Here you would also:
    // 1. Update creator revenue tracking
    // 2. Send conversion events to analytics platforms
    // 3. Trigger email confirmations
    // 4. Update user's premium status
  } catch (error) {
    console.error('Failed to track offer interaction:', error);
  }
}
