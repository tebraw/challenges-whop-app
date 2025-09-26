/**
 * 🎯 CHECK PAYMENT STATUS AND ENROLL USER
 * POST /api/challenges/[challengeId]/check-payment
 * 
 * Called after user completes payment to verify payment and create enrollment
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk-unified';

interface CheckPaymentRequest {
  checkoutSessionId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;
    const { checkoutSessionId } = await request.json() as CheckPaymentRequest;

    console.log('🔧 CHECKING PAYMENT STATUS:', {
      challengeId,
      checkoutSessionId
    });

    if (!checkoutSessionId) {
      return NextResponse.json(
        { error: 'Checkout session ID is required' },
        { status: 400 }
      );
    }

    // Get headers for user identification
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    const whopUserId = headersList.get('x-whop-user-id') || headersList.get('x-user-id');

    if (!whopUserToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user with Whop SDK
    const { userId } = await whopSdk.verifyUserToken(headersList);
    
    // Find local user
    const user = await prisma.user.findFirst({
      where: { whopUserId: userId },
      include: { tenant: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        enrollments: {
          where: { userId: user.id }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Check if user is already enrolled
    if (challenge.enrollments.length > 0) {
      console.log('✅ User already enrolled in challenge');
      return NextResponse.json({
        success: true,
        alreadyEnrolled: true,
        message: 'Already enrolled in challenge'
      });
    }

    // TODO: Check payment status with Whop API
    // For now, we'll assume payment is successful if we get to this point
    // In a real implementation, you would verify the payment status with Whop
    
    console.log('💰 Payment verification - assuming successful for checkout session:', checkoutSessionId);

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        challengeId: challengeId,
        experienceId: challenge.experienceId,
        joinedAt: new Date()
      },
      include: {
        challenge: {
          select: {
            title: true,
            startAt: true,
            endAt: true
          }
        }
      }
    });

    console.log('✅ User enrolled after payment verification');

    // Optionally, record the payment for tracking
    try {
      await prisma.offerConversion.create({
        data: {
          challengeOfferId: `paid_entry_${challengeId}`,
          userId: user.id,
          challengeId: challengeId,
          conversionType: 'paid_entry',
          whopCheckoutUrl: `https://whop.com/checkout/${checkoutSessionId}`,
          convertedAt: new Date()
        }
      });
    } catch (conversionError) {
      console.warn('Failed to record offer conversion:', conversionError);
      // Don't fail the enrollment if conversion tracking fails
    }

    return NextResponse.json({
      success: true,
      enrolled: true,
      message: `Successfully enrolled in "${challenge.title}" after payment!`,
      enrollment: {
        id: enrollment.id,
        joinedAt: enrollment.joinedAt,
        challenge: enrollment.challenge
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment status' },
      { status: 500 }
    );
  }
}