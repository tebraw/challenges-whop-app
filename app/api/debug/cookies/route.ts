import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  console.log('🍪 Checking cookies...');
  
  try {
    const cookieStore = await cookies();
    const allCookies: Record<string, string> = {};
    
    cookieStore.getAll().forEach(cookie => {
      allCookies[cookie.name] = cookie.value;
    });
    
    console.log('🍪 All cookies:', allCookies);
    
    const demoUserId = cookieStore.get('demo-user-id')?.value;
    console.log('🍪 Demo user ID cookie:', demoUserId);
    
    if (demoUserId) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const user = await prisma.user.findUnique({
        where: { id: demoUserId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          whopCompanyId: true,
          whopUserId: true
        }
      });
      
      console.log('🍪 User from demo cookie:', user);
      
      return NextResponse.json({
        success: true,
        cookies: allCookies,
        demoUserId,
        user
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'No demo user cookie found',
      cookies: allCookies,
      demoUserId: null
    });
    
  } catch (error) {
    console.error('❌ Cookie debug error:', error);
    return NextResponse.json({ 
      error: 'Cookie debug failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
