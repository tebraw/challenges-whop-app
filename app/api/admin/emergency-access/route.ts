// Emergency admin access endpoint for Whop environments
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🚨 Emergency admin access requested');
    
    const whopCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
    
    if (!whopCompanyId) {
      return NextResponse.json({ error: 'No Whop company ID configured' }, { status: 400 });
    }
    
    const tenantId = `tenant_${whopCompanyId}`;
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        whopCompanyId: whopCompanyId,
        role: 'ADMIN'
      }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return NextResponse.json({ 
        success: true, 
        message: 'Admin access already configured',
        admin: existingAdmin.email 
      });
    }
    
    // Create emergency admin
    const emergencyAdmin = await prisma.user.create({
      data: {
        email: `emergency.admin.${Date.now()}@whop.local`,
        name: 'Emergency Admin (Auto-created)',
        role: 'ADMIN',
        whopCompanyId: whopCompanyId,
        tenantId: tenantId
      }
    });
    
    console.log('🚨 Emergency admin created:', emergencyAdmin.email);
    
    // Also check challenges
    const challengeCount = await prisma.challenge.count({
      where: { tenantId: tenantId }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Emergency admin access created',
      admin: emergencyAdmin.email,
      challenges: challengeCount,
      tenantId: tenantId
    });
    
  } catch (error: any) {
    console.error('❌ Emergency admin creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create emergency admin', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Same as GET but for POST requests
  return GET(request);
}
