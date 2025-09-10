import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';

export async function POST(request: NextRequest) {
  try {
    // 🔒 SECURITY: Only admins can create checkout URLs
    await requireAdmin();
    
    const user = await getCurrentUser();
    
    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 🔒 SECURITY: Additional check - only company owners can access checkout
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Only company owners can purchase subscriptions.' },
        { status: 403 }
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

    // Use direct Whop app checkout URL instead of product checkout
    const checkoutUrl = plan.checkoutUrl;

    return NextResponse.json({
      checkoutUrl,
      plan
    });
  } catch (error) {
    console.error('Error creating checkout URL:', error);
    
    // Handle specific admin access errors
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Access denied. Only company owners can purchase subscriptions.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
