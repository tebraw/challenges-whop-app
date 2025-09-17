import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopAppSdk } from '@/lib/whop-sdk-dual';
import { autoCreateOrUpdateUser } from '@/lib/auto-company-extraction';
import { getExperienceContext } from '@/lib/whop-experience';

// GET /api/auth/init-user - Initialize user on first access
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 User initialization API called');
    
    // WHOP BEST PRACTICE: Extract userId and context
    const headersList = await headers();
    
    let userId: string | null = null;
    try {
      const tokenResult = await whopAppSdk.verifyUserToken(headersList);
      userId = tokenResult.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const experienceId = headersList.get('x-experience-id') || 
                        headersList.get('experience-id') ||
                        headersList.get('x-whop-experience-id');
    
    const headerCompanyId = headersList.get('x-whop-company-id');
    
    // BUSINESS DASHBOARD FIX: Also try to extract from experience context
    const experienceContext = await getExperienceContext();
    const companyIdFromContext = experienceContext?.companyId;
    
    const companyId = headerCompanyId || companyIdFromContext || undefined;
    
    console.log('🔍 User init context:', {
      userId,
      experienceId,
      headerCompanyId,
      companyIdFromContext,
      companyId
    });
    
    if (!experienceId && !companyId) {
      return NextResponse.json({ 
        error: 'Context required',
        debug: 'Neither experienceId nor companyId found - please access via Whop app'
      }, { status: 400 });
    }

    // 🎯 Create/update user with proper context
    const tenantId = experienceId || companyId!;
    const user = await autoCreateOrUpdateUser(userId!, experienceId || tenantId, companyId || null);

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