import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Check admin status
    const adminStatus = await isAdmin();
    
    // Return user data (excluding sensitive information)
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      whopCompanyId: user.whopCompanyId,
      whopUserId: user.whopUserId,
      isAdmin: adminStatus
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
