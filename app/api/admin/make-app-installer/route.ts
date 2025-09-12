import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
      try {
    console.log('👑 PROMOTING CURRENT USER TO APP INSTALLER...');
    
    // Get current user
    const user = await getCurrentUser();
    console.log('👤 Current user:', user);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No user found - please login first',
        suggestion: 'Go to the app via Whop first'
      });
    }
    
    // Remove any existing admins for this company (reset to fresh state)
    if (user.whopCompanyId) {
      await prisma.user.updateMany({
        where: {
          whopCompanyId: user.whopCompanyId,
          role: 'ADMIN'
        },
        data: {
          role: 'USER'
        }
      });
      console.log(`🔄 Reset all admins for company ${user.whopCompanyId} to USER`);
    }
    
    // Promote current user to app installer (admin)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'ADMIN'
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
    
    console.log('✅ App installer promotion completed:', updatedUser);
    
    return NextResponse.json({
      success: true,
      message: 'You are now the App Installer (Admin)!',
      user: updatedUser,
      note: 'All other users for this company will be regular users',
      action: 'Go to /admin to test',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ App installer promotion failed:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
