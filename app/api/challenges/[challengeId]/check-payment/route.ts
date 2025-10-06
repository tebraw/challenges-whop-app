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
import { whopPaymentService } from '@/lib/whop-payments';

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
      checkoutSessionId,
      timestamp: new Date().toISOString()
    });

    // ✅ FIRST: Validate input data
    if (!checkoutSessionId) {
      console.error('❌ Missing checkout session ID');
      return NextResponse.json(
        { error: 'Checkout session ID is required' },
        { status: 400 }
      );
    }

    if (!checkoutSessionId.startsWith('ch_')) {
      console.error('❌ Invalid checkout session format:', checkoutSessionId);
      return NextResponse.json(
        { error: 'Invalid checkout session format' },
        { status: 400 }
      );
    }

    // Get headers for user identification
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    const whopUserId = headersList.get('x-whop-user-id') || headersList.get('x-user-id');

    if (!whopUserToken) {
      console.error('❌ Missing authentication token');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user with Whop SDK
    let userId: string;
    try {
      const userData = await whopSdk.verifyUserToken(headersList);
      userId = userData.userId;
      console.log('✅ User authenticated:', userId);
    } catch (authError) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Find local user
    const user = await prisma.user.findFirst({
      where: { whopUserId: userId },
      include: { tenant: true }
    });

    if (!user) {
      console.error('❌ User not found in database:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', { 
      id: user.id, 
      whopUserId: user.whopUserId,
      tenantId: user.tenantId 
    });

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
      console.error('❌ Challenge not found:', challengeId);
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    console.log('✅ Challenge found:', { 
      id: challenge.id, 
      title: challenge.title,
      status: challenge.status,
      existingEnrollments: challenge.enrollments.length
    });

    // Check if user is already enrolled (webhook may have processed it)
    if (challenge.enrollments.length > 0) {
      console.log('✅ User already enrolled in challenge (processed by webhook)');
      return NextResponse.json({
        success: true,
        enrolled: true,
        alreadyEnrolled: true,
        message: 'Already enrolled in challenge'
      });
    }

    // Verify payment status with Whop Payment Service
    const paymentStatus = await whopPaymentService.checkPaymentStatus(checkoutSessionId);
    
    if (!paymentStatus.success) {
      console.error('❌ Payment verification failed:', paymentStatus.error);
      return NextResponse.json(
        { error: paymentStatus.error || 'Payment verification failed' },
        { status: 400 }
      );
    }

    if (paymentStatus.status !== 'completed') {
      console.log('⏳ Payment not yet completed, status:', paymentStatus.status);
      return NextResponse.json(
        { 
          success: false,
          status: paymentStatus.status,
          message: `Payment status: ${paymentStatus.status}` 
        },
        { status: 202 } // Accepted but not completed
      );
    }

    console.log('✅ Payment completed - creating enrollment and processing revenue sharing');
    
    // Import revenue sharing service
    const { distributeRevenue } = await import('@/lib/revenue-sharing');
    
    // Create enrollment immediately (don't wait for webhook)
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
            endAt: true,
            whopCreatorId: true
          }
        }
      }
    });

    console.log('✅ User enrolled after payment verification:', {
      enrollmentId: enrollment.id,
      challengeTitle: enrollment.challenge.title
    });

    // Process revenue sharing if creator is available
    if (challenge.whopCreatorId) {
      try {
        console.log('� Processing revenue sharing:', {
          challengeId,
          whopCreatorId: challenge.whopCreatorId,
          paymentAmount: 'from-challenge-offer'
        });

        await distributeRevenue({
          challengeId,
          creatorId: user.id,
          whopCreatorId: challenge.whopCreatorId,
          paymentId: checkoutSessionId,
          totalAmount: 100, // TODO: Get from challenge offer
          creatorAmount: 90,
          platformAmount: 10
        });

        console.log('✅ Revenue sharing completed successfully');
      } catch (revenueError) {
        console.error('❌ Revenue sharing failed:', revenueError);
        // Don't fail enrollment if revenue sharing fails
      }
    } else {
      console.log('⚠️ Skipping revenue sharing - missing creator info:', {
        whopCreatorId: challenge.whopCreatorId,
        paymentComplete: true
      });
    }

    return NextResponse.json({
      success: true,
      enrolled: true,
      status: 'enrollment_completed',
      message: `Successfully enrolled in "${challenge.title}" after payment!`,
      enrollment: {
        id: enrollment.id,
        joinedAt: enrollment.joinedAt,
        challenge: enrollment.challenge
      },
      checkoutSessionId,
      challengeId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment status' },
      { status: 500 }
    );
  }
}