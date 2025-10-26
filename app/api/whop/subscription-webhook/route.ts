// app/api/whop/subscription-webhook/route.ts
// Webhook to handle subscription payments and upgrade users to admin

import { NextRequest, NextResponse } from 'next/server';
import { getWhopSession, upgradeUserToAdmin } from '@/lib/whop/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Whop subscription webhook received');
    
    const body = await request.json();
    console.log('Webhook data:', JSON.stringify(body, null, 2));
    
    // Check if this is a successful payment event
    const isPaymentSuccess = (
      body.type === 'membership.created' ||
      body.type === 'payment.completed' ||
      body.type === 'subscription.activated'
    );
    
    if (!isPaymentSuccess) {
      console.log('Not a payment success event, ignoring');
      return NextResponse.json({ status: 'ignored' });
    }
    
    // Get user ID from webhook data
    const userId = body.data?.user?.id || body.data?.membership?.user?.id;
    
    if (!userId) {
      console.log('No user ID found in webhook');
      return NextResponse.json({ error: 'No user ID' }, { status: 400 });
    }
    
    console.log(`💰 Payment successful for user: ${userId}`);
    
    // Create a mock session to check user status
    // In real implementation, you'd fetch this from Whop API
    const session = await getWhopSession();
    
    if (session && session.userId === userId) {
      // Upgrade user to admin if they own companies and now have subscription
      await upgradeUserToAdmin(session);
      
      console.log('✅ User upgrade process completed');
      return NextResponse.json({ 
        status: 'success',
        message: 'User upgraded to admin after payment'
      });
    } else {
      console.log('Session not found or user mismatch');
      return NextResponse.json({ 
        status: 'no_action',
        message: 'User session not found'
      });
    }
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
