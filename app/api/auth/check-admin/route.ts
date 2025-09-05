// app/api/auth/check-admin/route.ts
import { NextResponse } from 'next/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    // PRODUCTION MODE: Only allow real Whop authentication
    const isAdminUser = await isAdmin();
    const currentUser = await getCurrentUser();
    
    return NextResponse.json({
      isAdmin: isAdminUser,
      hasAccess: isAdminUser,
      user: currentUser,
      message: isAdminUser 
        ? 'Admin access granted via Whop authentication' 
        : 'Access denied - Whop authentication required'
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { 
        isAdmin: false, 
        hasAccess: false,
        error: 'Authentication failed - Please login with Whop',
        loginUrl: '/auth/whop'
      },
      { status: 401 }
    );
  }
}
