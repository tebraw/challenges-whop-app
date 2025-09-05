// app/api/auth/experience-test/route.ts
import { NextResponse } from 'next/server';
import { getExperienceContext } from '@/lib/whop-experience';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    console.log('🧪 Testing Experience App authentication...');
    
    // Get Experience context
    const context = await getExperienceContext();
    
    // Try to get current user
    const user = await getCurrentUser();
    
    const result = {
      timestamp: new Date().toISOString(),
      experienceContext: context,
      currentUser: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        whopUserId: user.whopUserId
      } : null,
      status: {
        hasContext: !!(context.userId && context.companyId),
        hasUser: !!user,
        isAuthenticated: !!(user && context.userId),
        authMethod: user ? (context.userId ? 'experience-app' : 'other') : 'none'
      }
    };
    
    console.log('🧪 Experience test result:', result.status);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Experience test error:', error);
    return NextResponse.json({
      error: 'Experience test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
