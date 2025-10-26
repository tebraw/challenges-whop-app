// API Route: Automatic User Creation with Real Company ID
// Called automatically when someone accesses the app

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractCompanyIdFromExperience, getRealCompanyId, autoCreateOrUpdateUser } from '@/lib/auto-company-extraction';

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 AUTO-USER-CREATION: Processing new app access...");
    
    const headersList = await headers();
    const experienceId = headersList.get('x-whop-experience-id');
    const headerCompanyId = headersList.get('x-whop-company-id');
    const whopUserId = headersList.get('x-whop-user-id');
    const userToken = headersList.get('x-whop-user-token');
    
    if (!whopUserId || !userToken) {
      return NextResponse.json({ 
        error: "Missing required Whop headers",
        details: { whopUserId: !!whopUserId, userToken: !!userToken }
      }, { status: 400 });
    }
    
    console.log("📊 WHOP HEADERS:");
    console.log(`   User ID: ${whopUserId}`);
    console.log(`   Experience ID: ${experienceId || 'NONE'}`);
    console.log(`   Header Company ID: ${headerCompanyId || 'NONE'}`);
    
    // Use auto-extraction system - NO FALLBACKS!
    const result = await autoCreateOrUpdateUser(whopUserId!, experienceId, headerCompanyId);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("❌ AUTO-USER-CREATION ERROR:", error);
    return NextResponse.json({ 
      error: "Failed to create/update user",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Show current user status
    const headersList = await headers();
    const whopUserId = headersList.get('x-whop-user-id');
    
    if (!whopUserId) {
      return NextResponse.json({ error: "No Whop User ID in headers" }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { whopUserId },
      include: { tenant: true }
    });
    
    if (!user) {
      return NextResponse.json({ 
        exists: false,
        message: "User not found - will be created on next POST request"
      });
    }
    
    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        whopCompanyId: user.whopCompanyId,
        experienceId: user.experienceId
      },
      tenant: user.tenant
    });
    
  } catch (error) {
    console.error("❌ GET USER ERROR:", error);
    return NextResponse.json({ 
      error: "Failed to get user",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
