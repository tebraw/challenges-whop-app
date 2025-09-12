// app/api/admin/whop/create-product/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

const WHOP_API_BASE = process.env.WHOP_API_BASE_URL || 'https://api.whop.com';
const WHOP_API_KEY = process.env.WHOP_API_KEY;

export async function POST(req: NextRequest) {
      try {
    // SECURITY: Require admin authentication
    await requireAdmin();
    const user = await getCurrentUser();

    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const {
      name,
      description,
      price,
      currency = 'USD',
      product_type = 'subscription',
      billing_period = 'monthly',
      features = [],
      tier_id
    } = await req.json();

    // Validate required fields
    if (!name || !price || !tier_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, tier_id' },
        { status: 400 }
      );
    }

    // Create product on Whop
    const whopResponse = await fetch(`${WHOP_API_BASE}/v1/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: name,
        description: description || `${name} - Challenge Platform Subscription`,
        price: price * 100, // Convert to cents
        currency: currency,
        product_type: product_type,
        billing_period: billing_period,
        metadata: {
          tier_id: tier_id,
          features: JSON.stringify(features),
          platform: 'challenge_platform',
          revenue_share_percentage: 10
        }
      }),
    });

    if (!whopResponse.ok) {
      const errorData = await whopResponse.text();
      console.error('Whop API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create product on Whop', details: errorData },
        { status: whopResponse.status }
      );
    }

    const whopProduct = await whopResponse.json();

    // Store product information in our database
    // TODO: Add to your database here if needed
    
    return NextResponse.json({
      success: true,
      product_id: whopProduct.id,
      checkout_url: whopProduct.checkout_url,
      tier_id: tier_id,
      price: price,
      currency: currency,
      whop_product: whopProduct
    });

  } catch (error) {
    console.error('Error creating Whop product:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
