import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { SubscriptionService } from '@/lib/subscription-service';

export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY: Only admins can view subscription status
    await requireAdmin();
    
    const user = await getCurrentUser();
    
    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 🔒 SECURITY: Additional check - only company owners can view subscription data
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Only company owners can view subscription information.' },
        { status: 403 }
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
    
    // Handle specific admin access errors
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Access denied. Only company owners can view subscription information.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
