/**
 * 🎯 ONBOARDING STATUS API
 * GET /api/auth/onboarding-status
 * 
 * Check if user has completed onboarding
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For admins, onboarding is always complete
    const isOnboardingComplete = user.role === 'ADMIN';

    return NextResponse.json({
      isOnboardingComplete,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Onboarding status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
