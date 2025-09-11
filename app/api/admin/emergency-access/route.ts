import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// Emergency admin access endpoint
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Emergency access granted',
      user: {
        id: user.id,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Emergency access error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
