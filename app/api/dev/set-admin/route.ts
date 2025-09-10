import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 Setting development user session...');
  
  try {
    // Set demo user session for Company Owner testing
    const response = NextResponse.json({ 
      success: true, 
      message: 'Development session set for company owner',
      user: {
        id: 'cmfejkn7g0001xhfiekl2voej',
        email: 'grujicicfilip@whop.local',
        role: 'ADMIN',
        whopCompanyId: 'biz_YoIIIT73rXwrtK'
      }
    });
    
    // Set demo session cookie
    response.cookies.set('demo-user-id', 'cmfejkn7g0001xhfiekl2voej', {
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Failed to set development session:', error);
    return NextResponse.json({ 
      error: 'Failed to set development session', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
