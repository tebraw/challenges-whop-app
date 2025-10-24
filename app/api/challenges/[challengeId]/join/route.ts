import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopAppSdk } from '@/lib/whop-sdk-unified';
import { whopPaymentService } from '@/lib/whop-payments';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    // Get headers for Whop authentication (same as Experience pages)
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    
    if (!whopUserToken) {
      return NextResponse.json({ error: 'Unauthorized - No Whop token' }, { status: 401 });
    }

    // Verify user with Whop SDK (same method as Experience pages)
    const { userId } = await whopAppSdk.verifyUserToken(headersList);
    
    // Find user in our database
    const user = await prisma.user.findUnique({
      where: { whopUserId: userId },
      include: { tenant: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const { challengeId } = await params;

    // Check if challenge exists and is active
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        experienceId: true,
        monetizationRules: true,
        creatorId: true,        // ✅ Added for revenue sharing
        whopCreatorId: true,    // ✅ Added for revenue sharing
        _count: {
          select: { enrollments: true }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if challenge has not ended
    const now = new Date();
    const endDate = new Date(challenge.endAt);

    if (now > endDate) {
      return NextResponse.json({ error: 'Challenge has already ended' }, { status: 400 });
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challengeId,
          userId: user.id
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this challenge' }, { status: 400 });
    }

    // Enforce paid entry if monetization is enabled
    const monetization = (challenge.monetizationRules as any) || {};
    const paidEnabled = !!monetization.enabled;
    const entryPriceCents = Number(monetization.entryPriceCents) || 0;
    const entryCurrency = (monetization.entryCurrency || 'USD') as 'USD' | 'EUR' | 'GBP';

    if (paidEnabled) {
      if (!entryPriceCents || entryPriceCents <= 0) {
        return NextResponse.json({ error: 'Paid challenge is misconfigured (price missing).' }, { status: 400 });
      }

      console.log('🔧 PROCESSING PAID CHALLENGE JOIN:', {
        challengeId: challenge.id,
        userId: user.whopUserId || user.id,
        storedCents: entryPriceCents,
        convertedToDollars: entryPriceCents / 100,
        currency: entryCurrency,
        debug: 'Converting cents from database to dollars for Whop API (which expects dollars, not cents)'
      });

      // 🔧 FIX: Whop API expects amount in DOLLARS, not cents!
      // Database stores: entryPriceCents = 100 (for $1.00)
      // Whop API expects: amount = 1.00 (dollars), then internally converts to cents via amount * 100
      // So we convert cents back to dollars: 100 cents / 100 = 1.00 dollars
      const paymentResult = await whopPaymentService.initiatePayment(user.whopUserId || user.id, {
        amount: entryPriceCents / 100, // Convert cents to dollars for Whop API
        currency: entryCurrency.toLowerCase() as 'usd' | 'eur' | 'gbp',
        productName: `Challenge Entry: ${challenge.title}`,
        productDescription: `Entry fee for challenge: ${challenge.title}`,
        metadata: {
          type: 'challenge_entry',
          challengeId: challenge.id,
          experienceId: challenge.experienceId,
          creatorId: challenge.creatorId || '',
          whopCreatorId: challenge.whopCreatorId || '',
          totalAmount: String(entryPriceCents),
          creatorAmount: String(Math.floor(entryPriceCents * 0.9)), // 90% to creator
          platformAmount: String(Math.floor(entryPriceCents * 0.1)), // 10% platform fee
          // for reconciliation
          appEntity: 'challenge_enrollment',
        }
      });

      console.log('🔧 PAYMENT RESULT:', {
        success: paymentResult.success,
        hasInAppPurchase: !!paymentResult.inAppPurchase,
        error: paymentResult.error
      });

      if (!paymentResult.success) {
        console.log('❌ Payment failed:', paymentResult.error);
        return NextResponse.json({ 
          error: paymentResult.error || 'Failed to initiate payment',
          debug: 'Payment service returned failure'
        }, { status: 500 });
      }

      if (!paymentResult.inAppPurchase) {
        console.log('❌ No inAppPurchase object in successful payment result');
        return NextResponse.json({ 
          error: 'Payment service did not return inAppPurchase object',
          debug: 'Payment succeeded but no inAppPurchase object available'
        }, { status: 500 });
      }

      console.log('✅ Payment inAppPurchase object created successfully');
      return NextResponse.json({
        requirePayment: true,
        inAppPurchase: paymentResult.inAppPurchase,
        message: 'Payment required to join this challenge.'
      });
    }

    // Create enrollment (free challenge)
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

    return NextResponse.json({
      success: true,
      message: `Successfully joined "${challenge.title}"!`,
      enrollment: {
        id: enrollment.id,
        joinedAt: enrollment.joinedAt,
        challenge: enrollment.challenge
      }
    });

  } catch (error) {
    console.error('Error joining challenge:', error);
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    );
  }
}
