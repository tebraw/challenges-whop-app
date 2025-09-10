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

    const { participantCount } = await request.json();

    if (typeof participantCount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid participant count' },
        { status: 400 }
      );
    }

    const result = await SubscriptionService.checkCanAddParticipants(user.tenantId, participantCount);

    return NextResponse.json({
      canAdd: result.canAdd,
      reason: result.reason
    });
  } catch (error) {
    console.error('Error checking participant addition:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
