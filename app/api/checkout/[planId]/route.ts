import { NextRequest } from 'next/server';
import { WhopCheckoutSession } from '@/lib/discoverTypes';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ planId: string }> }
) {
  try {
    const apiKey = process.env.WHOP_APP_API_KEY;
    
    if (!apiKey) {
      return new Response('WHOP_APP_API_KEY not configured', { status: 500 });
    }

    const { affiliateUsername, source, experienceId } = await request.json().catch(() => ({}));
    const { planId } = await context.params;

    // Validate planId format (basic validation)
    if (!planId || typeof planId !== 'string' || planId.length < 3) {
      return new Response('Invalid planId', { status: 400 });
    }

    // Build checkout session payload
    const checkoutPayload: any = {
      planId: planId,
    };

    // Add affiliate code if provided and valid
    if (affiliateUsername && typeof affiliateUsername === 'string' && affiliateUsername.trim()) {
      checkoutPayload.affiliateCode = affiliateUsername.trim();
    }

    // Add metadata for tracking
    if (source) {
      checkoutPayload.metadata = { source };
    }

    console.log('Creating checkout session:', checkoutPayload);

    // Create checkout session with Whop API
    const response = await fetch('https://api.whop.com/v2/checkout-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whop checkout API error:', errorText);
      return new Response(`Checkout error: ${errorText}`, { status: response.status });
    }

    const data: WhopCheckoutSession = await response.json();
    const checkoutUrl = data.checkout_url || data.url;

    if (!checkoutUrl) {
      return new Response('No checkout URL received', { status: 500 });
    }

    return Response.json({ 
      url: checkoutUrl,
      success: true 
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Ensure only POST is allowed
export async function GET() {
  return new Response('Method not allowed', { status: 405 });
}
