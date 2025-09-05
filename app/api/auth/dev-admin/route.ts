// Development Auth Override - bypasses Whop auth for local testing
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // For development, always return a valid admin user
    const devUser = {
      id: 'dev-admin-123',
      email: 'admin@localhost.com',
      name: 'Dev Admin',
      role: 'ADMIN',
      whopUserId: 'user_11HQI5KrNDW1S', // Your actual Whop ID
      whopCompanyId: 'company_dev_123',
      isFreeTier: false,
      tier: 'enterprise'
    };

    console.log('🔧 Development Auth: Returning dev admin user');
    
    return NextResponse.json({
      user: devUser,
      isAdmin: true,
      hasAccess: true,
      message: 'Development mode - admin access granted'
    });

  } catch (error) {
    console.error('Dev auth error:', error);
    return NextResponse.json(
      { error: 'Dev auth failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Same as GET for convenience
  return GET(req);
}
