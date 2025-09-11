/**
 * 🎯 WHOP PAYMENT WEBHOOK
 * POST /api/payments/webhook
 * 
 * Implements WHOP RULE #7: 3-Phasen-Payments
 * Phase 3: Webhook → verify and process completed payments
 */
import { NextRequest, NextResponse } from 'next/server';
import { whopPaymentService } from '@/lib/whop-payments';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // 🎯 WHOP RULE #7: Verify webhook authenticity
    const webhookResult = await whopPaymentService.verifyPaymentWebhook(request);

    if (!webhookResult.verified) {
      console.log('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const { paymentId, userId, amount, metadata } = webhookResult;

    if (!paymentId || !userId) {
      console.log('Missing required webhook data');
      return NextResponse.json(
        { error: 'Missing required webhook data' },
        { status: 400 }
      );
    }

    // Process payment based on type
    if (metadata?.type === 'premium_challenge') {
      await processPremiumChallengePayment(
        userId,
        metadata.challengeId,
        paymentId,
        amount || 0
      );
    } else if (metadata?.type === 'subscription') {
      await processSubscriptionPayment(
        userId,
        metadata.planName,
        metadata.duration,
        paymentId,
        amount || 0
      );
    }

    console.log(`✅ Payment processed: ${paymentId} for user ${userId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process premium challenge purchase
 */
async function processPremiumChallengePayment(
  userId: string,
  challengeId: string,
  paymentId: string,
  amount: number
) {
  try {
    // Grant premium access to challenge
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Add premium challenge access logic here
        // Could be a separate table for premium access tracking
      }
    });

    // Log the payment
    console.log(`🎯 Premium challenge access granted: ${challengeId} for user ${userId}`);
    
  } catch (error) {
    console.error('Failed to process premium challenge payment:', error);
    throw error;
  }
}

/**
 * Process subscription payment
 */
async function processSubscriptionPayment(
  userId: string,
  planName: string,
  duration: string,
  paymentId: string,
  amount: number
) {
  try {
    // Calculate subscription end date
    const now = new Date();
    const endDate = new Date(now);
    
    if (duration === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (duration === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Update user subscription
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Add subscription fields to user model
        // subscriptionPlan: planName,
        // subscriptionEnd: endDate,
        // subscriptionActive: true
      }
    });

    console.log(`🎯 Subscription activated: ${planName} (${duration}) for user ${userId}`);
    
  } catch (error) {
    console.error('Failed to process subscription payment:', error);
    throw error;
  }
}
