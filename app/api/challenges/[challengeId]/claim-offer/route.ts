// app/api/challenges/[challengeId]/claim-offer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopAppSdk } from '@/lib/whop-sdk-dual';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;
    const { offerId } = await request.json();
    
    // Get headers for authentication
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    const whopUserId = headersList.get('x-whop-user-id') || headersList.get('x-user-id');
    const experienceId = headersList.get('x-whop-experience-id');
    
    if (!whopUserToken || !whopUserId || !offerId) {
      return NextResponse.json(
        { error: 'Authentication and offerId required' },
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { whopUserId: whopUserId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get challenge offer
    const challengeOffer = await prisma.challengeOffer.findUnique({
      where: { id: offerId },
      include: {
        challenge: true,
        whopProduct: true
      }
    });

    if (!challengeOffer || challengeOffer.challengeId !== challengeId) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    if (!challengeOffer.isActive) {
      return NextResponse.json(
        { error: 'Offer is no longer active' },
        { status: 400 }
      );
    }

    // Check if user is eligible (re-validate)
    const userEnrollment = await prisma.enrollment.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challengeId,
          userId: user.id
        }
      },
      include: {
        proofs: true
      }
    });

    if (!userEnrollment) {
      return NextResponse.json(
        { error: 'User not enrolled in challenge' },
        { status: 400 }
      );
    }

    // Re-calculate completion rate to ensure eligibility
    const allProofs = userEnrollment.proofs;
    let completionRate = 0;

    if (challengeOffer.challenge.cadence === 'DAILY') {
      const startDate = new Date(challengeOffer.challenge.startAt);
      const endDate = new Date(challengeOffer.challenge.endAt);
      const today = new Date();
      
      const elapsedDays = Math.floor((Math.min(today.getTime(), endDate.getTime()) - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const maxCheckIns = Math.max(1, elapsedDays);
      
      completionRate = (allProofs.length / maxCheckIns) * 100;
    } else if (challengeOffer.challenge.cadence === 'END_OF_CHALLENGE') {
      completionRate = allProofs.length > 0 ? 100 : 0;
    }

    // Validate eligibility
    const triggerConditions = challengeOffer.triggerConditions ? JSON.parse(challengeOffer.triggerConditions) : {};
    let isEligible = false;

    if (challengeOffer.offerType === 'completion') {
      isEligible = completionRate >= (triggerConditions.minCompletionRate || 90);
    } else if (challengeOffer.offerType === 'mid-challenge') {
      const minRate = triggerConditions.minCompletionRate || 25;
      const maxRate = triggerConditions.maxCompletionRate || 89;
      isEligible = completionRate >= minRate && completionRate <= maxRate;
    }

    if (!isEligible) {
      return NextResponse.json(
        { error: 'User no longer eligible for this offer' },
        { status: 400 }
      );
    }

    // Generate personalized promo code
    const promoCodeSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const personalizedPromoCode = `${challengeOffer.offerType.toUpperCase()}_${user.id.substring(0, 4)}_${promoCodeSuffix}`;

    // Create promo code via Whop API
    const promoData = {
      code: personalizedPromoCode,
      amount_off: challengeOffer.discountPercentage || 0,
      promo_type: 'percentage',
      plan_ids: [challengeOffer.whopProductId],
      unlimited_stock: false,
      max_uses: 1, // One-time use only
      new_users_only: false,
      user_id: whopUserId // Restrict to this specific user
    };

    const promoResponse = await fetch('https://api.whop.com/api/v2/promo_codes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_COMPANY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(promoData)
    });

    if (!promoResponse.ok) {
      const errorText = await promoResponse.text();
      console.error('Whop promo code creation failed:', errorText);
      throw new Error(`Failed to create promo code: ${promoResponse.status}`);
    }

    const createdPromoCode = await promoResponse.json();

    // Generate Whop checkout URL
    const checkoutUrl = `https://whop.com/checkout/${challengeOffer.whopProductId}?promo=${personalizedPromoCode}`;

    // Record conversion tracking
    await prisma.offerConversion.create({
      data: {
        challengeOfferId: challengeOffer.id,
        userId: user.id,
        challengeId: challengeId,
        conversionType: 'claimed',
        whopCheckoutUrl: checkoutUrl,
        metadata: JSON.stringify({
          promoCode: personalizedPromoCode,
          originalPrice: challengeOffer.originalPrice,
          discountedPrice: challengeOffer.discountedPrice,
          completionRate: Math.round(completionRate)
        })
      }
    });

    return NextResponse.json({
      success: true,
      promoCode: personalizedPromoCode,
      checkoutUrl: checkoutUrl,
      discount: {
        percentage: challengeOffer.discountPercentage,
        originalPrice: challengeOffer.originalPrice,
        discountedPrice: challengeOffer.discountedPrice
      },
      productName: challengeOffer.whopProduct?.name || 'Premium Product',
      message: challengeOffer.customMessage || `Congratulations! You've earned ${challengeOffer.discountPercentage}% off!`
    });

  } catch (error) {
    console.error('Error claiming offer:', error);
    return NextResponse.json(
      { error: 'Failed to claim offer' },
      { status: 500 }
    );
  }
}