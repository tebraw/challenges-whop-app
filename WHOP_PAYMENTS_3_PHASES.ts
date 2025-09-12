/**
 * 🎯 WHOP PAYMENTS IMPLEMENTATION - 3 PHASEN REGEL
 * Implementiert WHOP RULE #6: Payments - drei Phasen, nie abkürzen
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk';
import { getExperienceContext } from '@/lib/whop-experience';
import { prisma } from '@/lib/prisma';

/**
 * 🎯 PHASE 1: Server erstellt Charge
 * POST /api/payments/create-charge
 */
export async function POST(request: NextRequest) {
  try {
    // 🎯 WHOP RULE #3: Server-side auth validation
    const headersList = await headers();
    const { userId } = await whopSdk.verifyUserToken(headersList);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const experienceContext = await getExperienceContext();
    if (!experienceContext.experienceId) {
      return NextResponse.json({ error: 'Experience context required' }, { status: 400 });
    }

    const body = await request.json();
    const { productId, amount, challengeId } = body;

    // 🎯 PHASE 1: Server creates charge with metadata
    const charge = await whopSdk.payments.chargeUser({
      userId,
      amount: amount * 100, // 🎯 WHOP RULE #9: Cents statt Float
      currency: 'USD',
      productId,
      metadata: {
        // 🎯 WHOP RULE #9: metadata für eindeutige Zuordnung
        experienceId: experienceContext.experienceId,
        challengeId,
        entityType: 'challenge_reward',
        entityId: challengeId,
        // Idempotency key for safe processing
        idempotencyKey: `${experienceContext.experienceId}_${challengeId}_${Date.now()}`
      }
    });

    // Store pending payment in database
    await prisma.pendingPayment.create({
      data: {
        chargeId: charge.id,
        userId,
        experienceId: experienceContext.experienceId,
        challengeId,
        amount: amount * 100,
        status: 'pending',
        metadata: JSON.stringify(charge.metadata)
      }
    });

    return NextResponse.json({
      // 🎯 PHASE 2: Return inAppPurchase for client
      inAppPurchase: {
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        checkoutUrl: charge.checkoutUrl
      }
    });

  } catch (error: any) {
    console.error('Charge creation failed:', error);
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 });
  }
}

/**
 * 🎯 PHASE 2: Client öffnet Checkout (implemented in client)
 * This would be handled by @whop/iframe SDK:
 * 
 * const iframeSdk = useWhopIframeSdk();
 * await iframeSdk.openCheckout(inAppPurchase);
 */

/**
 * 🎯 PHASE 3: Server-Webhook validates & processes
 * POST /api/webhooks/payment-succeeded
 */
export async function handlePaymentSucceeded(webhookData: any) {
  try {
    const { id: chargeId, final_amount, user_id, metadata } = webhookData.data;

    console.log('🎯 PHASE 3: Payment succeeded webhook received:', chargeId);

    // 🎯 WHOP RULE #9: Idempotente Inserts - Check if already processed
    const existingPayment = await prisma.completedPayment.findUnique({
      where: { chargeId }
    });

    if (existingPayment) {
      console.log('✅ Payment already processed:', chargeId);
      return;
    }

    // Validate metadata
    if (!metadata.experienceId || !metadata.challengeId) {
      throw new Error('Invalid payment metadata');
    }

    // 🎯 WHOP RULE #9: Transactional processing
    await prisma.$transaction(async (tx) => {
      // 1. Record completed payment
      await tx.completedPayment.create({
        data: {
          chargeId,
          userId: user_id,
          experienceId: metadata.experienceId,
          challengeId: metadata.challengeId,
          amount: final_amount,
          status: 'completed',
          processedAt: new Date(),
          metadata: JSON.stringify(metadata)
        }
      });

      // 2. Update pending payment status
      await tx.pendingPayment.updateMany({
        where: { chargeId },
        data: { status: 'completed' }
      });

      // 3. Business logic - grant challenge access, rewards, etc.
      if (metadata.entityType === 'challenge_reward') {
        await tx.challengeReward.create({
          data: {
            challengeId: metadata.challengeId,
            userId: user_id,
            rewardType: 'premium_access',
            grantedAt: new Date()
          }
        });
      }
    });

    // 🎯 WHOP RULE #5: Optional WS-Broadcast after successful processing
    await whopSdk.websockets.sendMessage({
      target: { experience: metadata.experienceId },
      message: {
        type: 'payment_completed',
        userId: user_id,
        challengeId: metadata.challengeId,
        amount: final_amount,
        isTrusted: true // Server-sent = trusted
      }
    });

    console.log('✅ Payment processing completed:', chargeId);

  } catch (error) {
    console.error('❌ Payment webhook processing failed:', error);
    // 🎯 WHOP RULE #6: Keine Business-Aktion ohne Webhook-Bestätigung
    throw error;
  }
}

/**
 * 🎯 Example Client-side Payment Flow
 */
/*
async function initiatePayment(challengeId: string, amount: number) {
  try {
    // PHASE 1: Request server to create charge
    const response = await fetch('/api/payments/create-charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId,
        amount,
        productId: 'challenge_premium_access'
      })
    });

    const { inAppPurchase } = await response.json();

    // PHASE 2: Open checkout via iFrame SDK
    const iframeSdk = useWhopIframeSdk();
    const result = await iframeSdk.openCheckout(inAppPurchase);

    if (result.success) {
      // PHASE 3: Webhook will process payment
      showMessage('Payment initiated! Processing...');
      
      // Optional: Poll for completion or listen to WebSocket
      waitForPaymentCompletion(inAppPurchase.id);
    }

  } catch (error) {
    showError('Payment failed: ' + error.message);
  }
}

async function waitForPaymentCompletion(chargeId: string) {
  // Listen for trusted WebSocket message
  useOnWebsocketMessage((message) => {
    if (message.isTrusted && message.type === 'payment_completed' && message.chargeId === chargeId) {
      showSuccess('Payment completed! Access granted.');
      refreshUI();
    }
  });
}
*/
