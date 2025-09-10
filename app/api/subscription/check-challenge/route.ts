import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SubscriptionService } from '@/lib/subscription-service';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const result = await SubscriptionService.checkCanCreateChallenge(user.tenantId);

    if (!result.canCreate) {
      return NextResponse.json({
        canCreate: false,
        reason: result.reason
      }, { status: 403 });
    }

    // If allowed, increment the usage
    await SubscriptionService.incrementChallengeUsage(user.tenantId);

    return NextResponse.json({
      canCreate: true,
      message: 'Challenge creation allowed'
    });
  } catch (error) {
    console.error('Error checking challenge creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
