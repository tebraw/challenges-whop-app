// app/api/whop/create-checkout/route.ts
// Creates Whop checkout sessions for plan purchases

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🛒 Creating Whop checkout session...');
    
    const body = await request.json();
    const { productId, planName, successUrl, cancelUrl, metadata } = body;
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }
    
    console.log('Checkout request:', {
      productId,
      planName,
      metadata
    });
    
    // Create checkout session with Whop API
    const checkoutResponse = await fetch('https://api.whop.com/v5/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?purchased=true`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/plans?cancelled=true`,
        metadata: {
          plan_name: planName,
          app_id: process.env.NEXT_PUBLIC_WHOP_APP_ID,
          ...metadata
        }
      })
    });
    
    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      console.error('Whop checkout error:', errorText);
      return NextResponse.json({ 
        error: 'Failed to create checkout session' 
      }, { status: 500 });
    }
    
    const checkoutData = await checkoutResponse.json();
    
    console.log('✅ Checkout session created:', checkoutData.id);
    
    return NextResponse.json({
      checkoutUrl: checkoutData.url,
      sessionId: checkoutData.id
    });
    
  } catch (error) {
    console.error('❌ Checkout creation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}