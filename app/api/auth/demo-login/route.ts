// app/api/auth/demo-login/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('🧪 Demo login activated for testing...');
    
    // Get or create default tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: 'Demo Company' }
      });
    }
    
    // Get or create demo admin user
    let user = await prisma.user.findFirst({
      where: { email: 'demo@example.com' }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo Admin',
          role: 'ADMIN',
          tenantId: tenant.id,
          whopUserId: 'demo_user_123'
        }
      });
      console.log('🆕 Created demo admin user');
    }
    
    // Set demo session cookie
    const response = NextResponse.redirect(new URL('/admin', process.env.NEXTAUTH_URL || 'https://challenges-whop-app-sqmr.vercel.app'));
    response.cookies.set('demo-user-id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    return response;
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({
      error: 'Demo login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
