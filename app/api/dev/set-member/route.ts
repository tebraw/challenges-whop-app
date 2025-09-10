import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 Setting community member session...');
  
  try {
    // Create a community member user if not exists
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    let memberUser = await prisma.user.findFirst({
      where: { email: 'member@whop.local' }
    });
    
    if (!memberUser) {
      // Create member user with USER role
      const tenant = await prisma.tenant.findFirst({
        where: { whopCompanyId: 'biz_YoIIIT73rXwrtK' }
      });
      
      if (!tenant) {
        throw new Error('No tenant found for testing');
      }
      
      memberUser = await prisma.user.create({
        data: {
          email: 'member@whop.local',
          name: 'Community Member',
          role: 'USER', // This is the key difference
          whopCompanyId: 'biz_YoIIIT73rXwrtK',
          whopUserId: 'user_member_test123',
          tenantId: tenant.id
        }
      });
      
      console.log('✅ Created community member user:', memberUser.email);
    }
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Development session set for community member',
      user: {
        id: memberUser.id,
        email: memberUser.email,
        role: memberUser.role,
        whopCompanyId: memberUser.whopCompanyId
      }
    });
    
    // Set demo session cookie for member
    response.cookies.set('demo-user-id', memberUser.id, {
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Failed to set member session:', error);
    return NextResponse.json({ 
      error: 'Failed to set member session', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
