// app/api/challenges/[challengeId]/offers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopSdk, whopAppSdk } from '@/lib/whop-sdk-unified';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;
    
    // Get headers for authentication
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    const whopUserId = headersList.get('x-whop-user-id') || headersList.get('x-user-id');
    const experienceId = headersList.get('x-whop-experience-id');
    
    if (!whopUserToken || !whopUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user access via Whop App SDK
    const { userId } = await whopAppSdk.verifyUserToken(headersList);
    
    // Check if user has access to this experience
    if (experienceId) {
      const experienceAccess = await whopAppSdk.access.checkIfUserHasAccessToExperience({
        userId,
        experienceId
      });
      
      if (!experienceAccess.hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to experience' },
          { status: 403 }
        );
      }
    }

    // First, get or create user in our database
    let user = await prisma.user.findUnique({
      where: { whopUserId: whopUserId }
    });

    if (!user) {
      // User doesn't exist in our database yet
      return NextResponse.json(
        { offers: [] },
        { status: 200 }
      );
    }

    // Get challenge and user enrollment
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        challengeOffers: {
          where: { isActive: true },
          include: {
            whopProduct: true
          }
        },
        enrollments: {
          where: { userId: user.id },
          include: {
            proofs: true
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const userEnrollment = challenge.enrollments[0];
    if (!userEnrollment) {
      return NextResponse.json(
        { offers: [] },
        { status: 200 }
      );
    }

    // Calculate user completion rate
    const allProofs = userEnrollment.proofs;
    let completedCheckIns = 0;
    let maxCheckIns = 1;
    let completionRate = 0;

    if (challenge.cadence === 'DAILY') {
      const startDate = new Date(challenge.startAt);
      const endDate = new Date(challenge.endAt);
      const today = new Date();
      
      const totalChallengeDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const elapsedDays = Math.floor((Math.min(today.getTime(), endDate.getTime()) - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      completedCheckIns = allProofs.length;
      maxCheckIns = Math.max(1, elapsedDays); // At least 1 to avoid division by zero
      
    } else if (challenge.cadence === 'END_OF_CHALLENGE') {
      completedCheckIns = allProofs.length > 0 ? 1 : 0;
      maxCheckIns = 1;
    }

    completionRate = maxCheckIns > 0 ? (completedCheckIns / maxCheckIns) * 100 : 0;

    // Filter offers based on eligibility
    const eligibleOffers = challenge.challengeOffers.filter((offer: any) => {
      const triggerConditions = offer.triggerConditions ? JSON.parse(offer.triggerConditions) : {};
      
      // Check offer type eligibility
      if (offer.offerType === 'completion') {
        // Completion offers: user must have 90%+ completion rate
        return completionRate >= (triggerConditions.minCompletionRate || 90);
      } else if (offer.offerType === 'mid-challenge') {
        // Mid-challenge boost: user must have 25%+ but less than 90% completion
        const minRate = triggerConditions.minCompletionRate || 25;
        const maxRate = triggerConditions.maxCompletionRate || 89;
        return completionRate >= minRate && completionRate <= maxRate;
      }
      
      return false;
    });

    // Format offers for frontend
    const formattedOffers = eligibleOffers.map((offer: any) => ({
      id: offer.id,
      offerType: offer.offerType,
      whopProductId: offer.whopProductId,
      productName: offer.whopProduct?.name || 'Premium Product',
      productDescription: offer.whopProduct?.description || '',
      originalPrice: offer.originalPrice,
      discountedPrice: offer.discountedPrice,
      discountPercentage: offer.discountPercentage,
      customMessage: offer.customMessage,
      timeLimit: offer.timeLimit,
      isActive: offer.isActive,
      createdAt: offer.createdAt
    }));

    return NextResponse.json({
      offers: formattedOffers,
      userStats: {
        completionRate: Math.round(completionRate),
        completedCheckIns,
        maxCheckIns,
        totalProofs: allProofs.length
      }
    });

  } catch (error) {
    console.error('Error fetching challenge offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}