// Development Auth Override - bypasses Whop auth for local testing
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // For development, always return a valid admin user
    const devUser = {
      id: 'dev-admin-123',
      email: 'user_eGf5vVjIuGLSy@whop.com',
      name: 'Dev Admin',
      role: 'ADMIN',
      whopUserId: 'user_eGf5vVjIuGLSy', // Your actual Whop ID
      whopCompanyId: 'biz_6VbYXNrtpPosFU', // Your actual Company ID
      tenantId: 'tenant-123',
      createdAt: new Date(),
      isFreeTier: false,
      tier: 'enterprise'
    };

    console.log('🔧 Development Auth: Returning dev admin user for user_eGf5vVjIuGLSy');
    
    return NextResponse.json({
      user: devUser,
      isAdmin: true,
      hasAccess: true,
      message: 'Development mode - admin access granted with real user data'
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
  try {
    // For development, set admin session and redirect
    const response = NextResponse.redirect(new URL('/admin', req.url));
    
    // Set session cookies for dev admin
    response.cookies.set('dev-admin', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });
    
    response.cookies.set('admin-user', JSON.stringify({
      id: 'dev-admin-123',
      email: 'admin@localhost.com',
      name: 'Dev Admin',
      role: 'ADMIN',
      whopUserId: 'user_11HQI5KrNDW1S',
      isFreeTier: false
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60
    });

    console.log('🔧 Development Auth: Setting session and redirecting to /admin');
    return response;

  } catch (error) {
    console.error('Dev auth error:', error);
    return NextResponse.json(
      { error: 'Dev auth failed' },
      { status: 500 }
    );
  }
}
