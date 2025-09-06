import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    return NextResponse.json({
      success: true,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        whopUserId: user.whopUserId,
        whopCompanyId: user.whopCompanyId,
        createdAt: user.createdAt
      } : null,
      headers: Object.fromEntries(req.headers.entries()),
      cookies: req.cookies.getAll(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      user: null,
      timestamp: new Date().toISOString()
    });
  }
}
