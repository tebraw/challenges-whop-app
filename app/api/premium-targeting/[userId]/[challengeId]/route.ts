import { NextRequest, NextResponse } from 'next/server';
import { calculateUserProgress, getPremiumOffer, trackOfferInteraction } from '@/lib/premiumTargeting';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string; challengeId: string }> }
) {
  try {
    const { userId, challengeId } = await context.params;

    if (!userId || !challengeId) {
      return NextResponse.json(
        { error: 'Missing userId or challengeId' },
        { status: 400 }
      );
    }

    // Calculate user progress
    const progress = await calculateUserProgress(userId, challengeId);
    
    if (!progress) {
      return NextResponse.json(
        { error: 'User enrollment not found' },
        { status: 404 }
      );
    }

    // Get the best premium offer for this user
    const premiumOffer = getPremiumOffer(progress);
    
    // Track the offer view if there is one
    if (premiumOffer) {
      await trackOfferInteraction(challengeId, userId, premiumOffer.id, 'view');
    }

    const response = {
      userProgress: progress,
      premiumOffer,
      monetizationRules: {
        enabled: true,
        completionOffer: "Vollständiger Zugang zu allen Premium-Trainingsplänen",
        highEngagementOffer: "VIP-Zugang zu exklusiven Workouts und 1-on-1 Coaching",
        milestoneOffers: [
          {
            milestone: "75% completion",
            offer: "Premium-Trainingsplan mit 30% Rabatt",
            discount: 30
          }
        ]
      },
      analytics: {
        segment: premiumOffer?.targetSegment || 'standard',
        conversionProbability: progress.isHighEngagement && progress.completionRate >= 75 ? 0.35 : 
                               progress.isHighEngagement ? 0.25 : 0.15,
        estimatedValue: premiumOffer?.discountPrice || 0
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Premium targeting API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate premium targeting' },
      { status: 500 }
    );
  }
}
