// API Route: Auth Cleanup for Fallback Company IDs
// Automatically cleans up users with invalid fallback company IDs

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('🧹 Auth Cleanup API called');
  
  try {
    const headersList = await headers();
    const whopUserId = headersList.get('x-whop-user-id') || headersList.get('x-user-id');
    
    if (!whopUserId) {
      return NextResponse.json({
        success: false,
        error: 'No user ID found',
        debug: 'x-whop-user-id header missing'
      }, { status: 401 });
    }
    
    console.log(`🔍 Checking user ${whopUserId} for fallback company ID`);
    
    // Find user with fallback company ID
    const user = await prisma.user.findUnique({
      where: { whopUserId },
      select: {
        id: true,
        email: true,
        whopCompanyId: true,
        role: true
      }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: `User with ID ${whopUserId} not found in database`
      }, { status: 404 });
    }
    
    // Check if user has valid company ID format
    if (user.whopCompanyId && user.whopCompanyId.startsWith('biz_') && user.whopCompanyId.length >= 10) {
      return NextResponse.json({
        success: true,
        message: 'User has valid company ID',
        user: {
          id: user.id,
          email: user.email,
          companyId: user.whopCompanyId,
          role: user.role
        },
        action: 'none'
      });
    }
    
    console.log(`🚨 User ${user.email} has fallback company ID - cleaning up`);
    
    // Delete user with fallback company ID to force re-creation
    await prisma.user.delete({
      where: { id: user.id }
    });
    
    console.log(`✅ Deleted user ${user.email} with fallback company ID`);
    
    return NextResponse.json({
      success: true,
      message: 'User with fallback company ID deleted',
      action: 'user_deleted',
      debug: 'User will be re-created with correct company ID on next access',
      deletedUser: {
        email: user.email,
        oldCompanyId: user.whopCompanyId
      }
    });
    
  } catch (error) {
    console.error('❌ Auth Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Cleanup failed',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // GET version for debugging
  console.log('🔍 Auth Cleanup Status Check');
  
  try {
    const headersList = await headers();
    const whopUserId = headersList.get('x-whop-user-id') || headersList.get('x-user-id');
    
    if (!whopUserId) {
      return NextResponse.json({
        hasUser: false,
        debug: 'No user ID in headers'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { whopUserId },
      select: {
        id: true,
        email: true,
        whopCompanyId: true,
        role: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return NextResponse.json({
        hasUser: false,
        whopUserId,
        debug: 'User not found in database'
      });
    }
    
    return NextResponse.json({
      hasUser: true,
      user: {
        id: user.id,
        email: user.email,
        companyId: user.whopCompanyId,
        role: user.role,
        createdAt: user.createdAt
      },
      hasFallbackCompanyId: !user.whopCompanyId || !user.whopCompanyId.startsWith('biz_') || user.whopCompanyId.length < 10,
      needsCleanup: !user.whopCompanyId || !user.whopCompanyId.startsWith('biz_') || user.whopCompanyId.length < 10
    });
    
  } catch (error) {
    console.error('❌ Auth Cleanup status error:', error);
    return NextResponse.json({
      error: 'Status check failed',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
