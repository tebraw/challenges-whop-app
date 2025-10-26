/**
 * 🎯 CONFIRM ENROLLMENT AFTER SUCCESSFUL PAYMENT
 * POST /api/challenges/[challengeId]/confirm-enrollment
 * 
 * Called immediately after inAppPurchase returns success
 * Creates enrollment based on successful payment receipt
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopAppSdk } from '@/lib/whop-sdk-unified';

interface ConfirmEnrollmentRequest {
  receiptId: string;
  paymentId?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;
    const { receiptId, paymentId } = await request.json() as ConfirmEnrollmentRequest;

    console.log('🎯 CONFIRMING ENROLLMENT:', {
      challengeId,
      receiptId,
      paymentId,
      timestamp: new Date().toISOString()
    });

    if (!receiptId) {
      console.error('❌ Missing receipt ID');
      return NextResponse.json(
        { error: 'Receipt ID is required' },
        { status: 400 }
      );
    }

    // Get headers for user authentication
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    
    if (!whopUserToken) {
      console.error('❌ Missing authentication token');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user with Whop SDK
    const { userId } = await whopAppSdk.verifyUserToken(headersList);
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { whopUserId: userId }
    });

    if (!user) {
      console.error('❌ User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User authenticated:', { 
      id: user.id, 
      whopUserId: user.whopUserId 
    });

    // Find challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        title: true,
        experienceId: true,
        creatorId: true,
        whopCreatorId: true,
        monetizationRules: true,
        status: true,
        startAt: true,
        endAt: true,
        creator: {              // ✅ Load creator with tier info
          select: {
            id: true,
            tier: true
          }
        }
      }
    });

    if (!challenge) {
      console.error('❌ Challenge not found:', challengeId);
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    console.log('✅ Challenge found:', { 
      id: challenge.id, 
      title: challenge.title,
      status: challenge.status
    });

    // Check if already enrolled (prevent duplicates)
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        challengeId: challengeId
      }
    });

    if (existingEnrollment) {
      console.log('✅ User already enrolled (duplicate prevention)');
      return NextResponse.json({
        success: true,
        enrolled: true,
        alreadyEnrolled: true,
        enrollmentId: existingEnrollment.id,
        message: 'Already enrolled in challenge'
      });
    }

    // Create enrollment - payment was successful!
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        challengeId: challengeId,
        experienceId: challenge.experienceId,
        joinedAt: new Date()
      }
    });

    console.log('✅ Enrollment created:', {
      enrollmentId: enrollment.id,
      userId: user.id,
      challengeId: challengeId
    });

    // Create revenue share record if we have creator info and payment details
    if (challenge.creatorId && challenge.whopCreatorId && challenge.monetizationRules) {
      const monetization = challenge.monetizationRules as any;
      if (monetization.enabled && monetization.entryPriceCents) {
        const totalAmountCents = monetization.entryPriceCents;
        
        // Calculate commission based on creator's tier
        // Pre: 50% to creator, 50% to platform
        // Professional: 90% to creator, 10% to platform
        // Default (Basic/unknown): 90% to creator, 10% to platform
        const creatorTier = challenge.creator?.tier || 'Professional';
        const creatorPercentage = creatorTier === 'Starter' ? 0.5 : 0.9;
        const platformPercentage = 1 - creatorPercentage;
        
        const creatorAmountCents = Math.floor(totalAmountCents * creatorPercentage);
        const platformFeeCents = totalAmountCents - creatorAmountCents; // Ensure total equals entry price

        try {
          // Import revenue distribution service
          const { distributeRevenue } = await import('@/lib/revenue-sharing');
          
          console.log('💰 Initiating revenue distribution for payment confirmation:', {
            challengeId,
            creatorId: challenge.creatorId,
            whopCreatorId: challenge.whopCreatorId,
            creatorTier,
            totalAmount: totalAmountCents,
            creatorAmount: creatorAmountCents,
            creatorPercentage: `${creatorPercentage * 100}%`,
            platformFee: platformFeeCents,
            platformPercentage: `${platformPercentage * 100}%`
          });

          // Distribute revenue using the service (creates record + calls payUser)
          const result = await distributeRevenue({
            challengeId: challengeId,
            creatorId: challenge.creatorId,
            whopCreatorId: challenge.whopCreatorId,
            paymentId: paymentId || receiptId,
            totalAmount: totalAmountCents,
            creatorAmount: creatorAmountCents,
            platformAmount: platformFeeCents
          });

          if (result.success) {
            console.log('✅ Revenue distribution completed:', {
              revenueShareId: result.revenueShareId,
              transferId: result.transferId,
              creatorAmount: creatorAmountCents
            });
          } else {
            console.error('❌ Revenue distribution failed:', {
              error: result.error,
              shouldRetry: result.shouldRetry
            });
          }
        } catch (revenueError) {
          console.error('❌ Failed to process revenue distribution:', revenueError);
          // Don't fail enrollment if revenue tracking fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      enrolled: true,
      enrollmentId: enrollment.id,
      message: `Successfully enrolled in "${challenge.title}"!`,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        startAt: challenge.startAt,
        endAt: challenge.endAt
      }
    });

  } catch (error) {
    console.error('❌ Error confirming enrollment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to confirm enrollment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
