import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk';
import { autoCreateOrUpdateUser } from '@/lib/auto-company-extraction';

// GET /api/auth/init-user - Initialize user on first access
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 User initialization API called');
    
    // WHOP BEST PRACTICE: Extract userId and context
    const headersList = await headers();
    
    let userId: string | null = null;
    try {
      const tokenResult = await whopSdk.verifyUserToken(headersList);
      userId = tokenResult.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const experienceId = headersList.get('x-experience-id') || 
                        headersList.get('experience-id') ||
                        headersList.get('x-whop-experience-id');
    
    const headerCompanyId = headersList.get('x-whop-company-id');
    
    console.log('🔍 User init context:', {
      userId,
      experienceId,
      headerCompanyId
    });
    
    if (!experienceId && !headerCompanyId) {
      return NextResponse.json({ 
        error: 'Context required',
        debug: 'Neither experienceId nor companyId found - please access via Whop app'
      }, { status: 400 });
    }

    // 🎯 Create/update user with proper context
    const tenantId = experienceId || headerCompanyId!;
    const user = await autoCreateOrUpdateUser(userId!, experienceId || tenantId, headerCompanyId || null);

    console.log('✅ User initialized:', {
      userId: user.whopUserId,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        whopUserId: user.whopUserId,
        whopCompanyId: user.whopCompanyId
      },
      context: {
        experienceId,
        companyId: headerCompanyId,
        tenantId
      }
    });

  } catch (error) {
    console.error('User initialization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize user',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}