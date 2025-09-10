import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SubscriptionService } from '@/lib/subscription-service';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(user.tenantId);
    const limits = await SubscriptionService.getCurrentUsage(user.tenantId);

    return NextResponse.json({
      isActive: subscriptionStatus.isActive,
      plan: subscriptionStatus.plan,
      subscription: subscriptionStatus.subscription,
      limits,
      planName: subscriptionStatus.plan?.name
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
