/**
 * 🎯 WHOP PAYMENT INITIATION API
 * POST /api/payments/initiate
 * 
 * Implements WHOP RULE #7: 3-Phasen-Payments
 * Phase 1: chargeUser → creates payment session
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk';
import { whopPaymentService, PaymentRequest } from '@/lib/whop-payments';

export async function POST(request: NextRequest) {
  try {
    // 🎯 WHOP RULE #3: Server-side auth validation
    const headersList = await headers();
    
    let userId: string;
    try {
      const tokenResult = await whopSdk.verifyUserToken(headersList);
      userId = tokenResult.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - invalid Whop token' },
        { status: 401 }
      );
    }

    // Parse payment request
    const paymentRequest: PaymentRequest = await request.json();

    // Validate required fields
    if (!paymentRequest.amount || !paymentRequest.currency || !paymentRequest.productName) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    // 🎯 WHOP RULE #7: Initiate payment through Whop
    const paymentResult = await whopPaymentService.initiatePayment(userId, paymentRequest);

    return NextResponse.json(paymentResult);

  } catch (error) {
    console.error('Payment initiation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
