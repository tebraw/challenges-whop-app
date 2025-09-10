import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { planId } = await request.json();
    
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Create Whop checkout URL
    const checkoutUrl = `https://whop.com/checkout/${plan.whopProductId}?company_id=${process.env.NEXT_PUBLIC_WHOP_COMPANY_ID}`;

    return NextResponse.json({
      checkoutUrl,
      plan
    });
  } catch (error) {
    console.error('Error creating checkout URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
