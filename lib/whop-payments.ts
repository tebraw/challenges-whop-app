/**
 * 🎯 WHOP PAYMENT SERVICE
 * 
 * Implements WHOP RULE #7: 3-Phasen-Payments: chargeUser → iFrame Modal → Webhook
 * This ensures all payments flow through Whop's secure payment system
 */
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from './whop-sdk';

export interface PaymentRequest {
  amount: number; // in cents
  currency: 'usd' | 'eur' | 'gbp'; // Whop supported currencies (lowercase)
  productName: string;
  productDescription?: string;
  metadata?: Record<string, string>;
}

export interface PaymentInitResponse {
  success: boolean;
  checkoutSessionId?: string;
  status?: string;
  error?: string;
}

export interface PaymentStatus {
  checkoutSessionId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

class WhopPaymentService {
  /**
   * 🎯 PHASE 1: Initialize payment with chargeUser
   * This creates a payment intent and returns checkout session
   */
  async initiatePayment(
    userId: string,
    paymentRequest: PaymentRequest
  ): Promise<PaymentInitResponse> {
    try {
      // 🎯 WHOP RULE #7: Use chargeUser to initiate payment
      const paymentResult = await whopSdk.payments.chargeUser({
        userId,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        metadata: paymentRequest.metadata
      });

      if (!paymentResult) {
        return {
          success: false,
          error: 'Failed to create payment session'
        };
      }

      return {
        success: true,
        checkoutSessionId: paymentResult.inAppPurchase?.id,
        status: paymentResult.status
      };

    } catch (error) {
      console.error('Payment initiation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initiation failed'
      };
    }
  }

  /**
   * 🎯 PHASE 2: Create checkout session for more complex payments
   */
  async createCheckoutSession(
    planId: string
  ): Promise<PaymentInitResponse> {
    try {
      const checkoutSession = await whopSdk.payments.createCheckoutSession({
        planId
      });

      if (!checkoutSession) {
        return {
          success: false,
          error: 'Failed to create checkout session'
        };
      }

      return {
        success: true,
        checkoutSessionId: checkoutSession.id,
        status: 'pending'
      };

    } catch (error) {
      console.error('Checkout session creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Checkout session creation failed'
      };
    }
  }

  /**
   * 🎯 PHASE 3: Verify webhook payment completion
   * This should be called from your webhook endpoint
   */
  async verifyPaymentWebhook(request: NextRequest): Promise<{
    verified: boolean;
    paymentId?: string;
    userId?: string;
    amount?: number;
    metadata?: Record<string, string>;
  }> {
    try {
      // Get webhook signature from headers
      const headersList = await headers();
      const signature = headersList.get('whop-signature');
      
      if (!signature) {
        console.log('No Whop signature found in webhook');
        return { verified: false };
      }

      const body = await request.text();
      
      // For now, we'll parse the webhook manually
      // TODO: Implement proper webhook verification when SDK supports it
      try {
        const eventData = JSON.parse(body);
        
        if (eventData.type === 'payment.completed' || eventData.type === 'subscription.created') {
          return {
            verified: true,
            paymentId: eventData.data.id,
            userId: eventData.data.userId,
            amount: eventData.data.amount,
            metadata: eventData.data.metadata
          };
        }
      } catch (parseError) {
        console.error('Failed to parse webhook body:', parseError);
      }

      return { verified: false };

    } catch (error) {
      console.error('Webhook verification failed:', error);
      return { verified: false };
    }
  }

  /**
   * 🎯 CHALLENGE-SPECIFIC: Premium Challenge Purchase
   */
  async purchasePremiumChallenge(
    userId: string,
    challengeId: string,
    challengeTitle: string,
    price: number
  ): Promise<PaymentInitResponse> {
    return this.initiatePayment(userId, {
      amount: price * 100, // Convert to cents
      currency: 'eur',
      productName: `Premium Challenge: ${challengeTitle}`,
      productDescription: `Access to premium challenge features`,
      metadata: {
        type: 'premium_challenge',
        challengeId,
        userId
      }
    });
  }

  /**
   * 🎯 CHALLENGE-SPECIFIC: Subscription Purchase
   */
  async purchaseSubscription(
    userId: string,
    planName: string,
    price: number,
    duration: 'monthly' | 'yearly'
  ): Promise<PaymentInitResponse> {
    return this.initiatePayment(userId, {
      amount: price * 100, // Convert to cents
      currency: 'eur',
      productName: `${planName} Subscription (${duration})`,
      productDescription: `Access to premium features for ${duration} billing`,
      metadata: {
        type: 'subscription',
        planName,
        duration,
        userId
      }
    });
  }
}

export const whopPaymentService = new WhopPaymentService();

/**
 * 🎯 CLIENT-SIDE PAYMENT HOOK
 * Use this in React components to handle payments
 */
export function useWhopPayments() {
  const initiatePayment = async (paymentRequest: PaymentRequest) => {
    const response = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentRequest),
    });

    const result = await response.json();
    
    if (result.success && result.checkoutSessionId) {
      // 🎯 WHOP RULE #7: Payment will be handled by Whop's checkout system
      console.log('Payment initiated:', result.checkoutSessionId);
    }

    return result;
  };

  const checkPaymentStatus = async (checkoutSessionId: string) => {
    const response = await fetch(`/api/payments/status/${checkoutSessionId}`);
    return response.json();
  };

  return {
    initiatePayment,
    checkPaymentStatus
  };
}
