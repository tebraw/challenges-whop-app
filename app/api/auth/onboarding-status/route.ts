import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// Check user onboarding status
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user has completed onboarding
    const isOnboarded = user.role === 'ADMIN'; // Simple check for now
    
    return NextResponse.json({ 
      isOnboarded,
      user: {
        id: user.id,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
