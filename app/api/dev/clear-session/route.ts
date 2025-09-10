import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 Clearing all sessions...');
  
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: 'All sessions cleared'
    });
    
    // Clear all demo session cookies
    response.cookies.set('demo-user-id', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true
    });
    
    response.cookies.set('as', '', {
      path: '/',
      maxAge: 0
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Failed to clear sessions:', error);
    return NextResponse.json({ 
      error: 'Failed to clear sessions', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
