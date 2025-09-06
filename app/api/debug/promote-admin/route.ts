import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 Manual Admin Promotion...');
    
    // Get the user ID from the request body or use default
    const body = await req.json().catch(() => ({}));
    const whopUserId = body.whopUserId || 'user_eGf5vVjIuGLSy'; // Default to the user from debug data
    
    console.log('🎯 Promoting user:', whopUserId);
    
    // Find and update the user
    const user = await prisma.user.findUnique({
      where: { whopUserId }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        whopUserId,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('👤 Found user:', user);
    
    // Update to ADMIN role
    const updatedUser = await prisma.user.update({
      where: { whopUserId },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        whopUserId: true,
        whopCompanyId: true
      }
    });
    
    console.log('✅ User promoted to admin:', updatedUser);
    
    return NextResponse.json({
      success: true,
      message: 'User promoted to ADMIN',
      before: { role: user.role },
      after: updatedUser,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Admin promotion failed:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// GET route for quick promotion without body
export async function GET(req: NextRequest) {
  try {
    const whopUserId = 'user_eGf5vVjIuGLSy'; // Default user from debug data
    
    const user = await prisma.user.findUnique({
      where: { whopUserId }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        whopUserId,
        timestamp: new Date().toISOString()
      });
    }
    
    const updatedUser = await prisma.user.update({
      where: { whopUserId },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        whopUserId: true,
        whopCompanyId: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'User promoted to ADMIN via GET',
      before: { role: user.role },
      after: updatedUser,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
