/**
 * 🚨 EMERGENCY ACCESS API
 * POST /api/admin/emergency-access
 * 
 * Provides emergency access for debugging and admin recovery
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // This is for development/testing only
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Emergency access disabled in production' },
        { status: 403 }
      );
    }

    console.log('🚨 Emergency access requested:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Emergency access endpoint - development only'
    });

  } catch (error) {
    console.error('Emergency access error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
