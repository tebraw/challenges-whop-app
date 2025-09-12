import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
      try {
    console.log('🚨 EMERGENCY ADMIN RESTORE - Starting...');
    
    // Get current user
    const user = await getCurrentUser();
    console.log('👤 Current user:', user);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No user found - please login first',
        suggestion: 'Go to /dev-login or /auth/whop first'
      });
    }
    
    // Force restore admin privileges
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'ADMIN',
        whopCompanyId: '9nmw5yleoqldrxf7n48c' // Your known company ID
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        whopCompanyId: true,
        whopUserId: true
      }
    });
    
    console.log('✅ Emergency admin restore completed:', updatedUser);
    
    return NextResponse.json({
      success: true,
      message: 'Admin privileges restored!',
      user: updatedUser,
      action: 'Go to /admin to test',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Emergency restore failed:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
