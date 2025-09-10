import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getExperienceContext } from '@/lib/whop-experience';
import { getWhopUserFromHeaders } from '@/lib/whop-auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  console.log('🔍 === ROLE DETECTION DEBUG ===');
  
  try {
    // 1. Raw Headers Analysis
    const h = await headers();
    const allHeaders: Record<string, string> = {};
    h.forEach((value, key) => {
      allHeaders[key] = value;
    });

    console.log('📋 All incoming headers:', Object.keys(allHeaders).filter(k => 
      k.toLowerCase().includes('whop') || 
      k.toLowerCase().includes('user') || 
      k.toLowerCase().includes('company') ||
      k.toLowerCase().includes('auth') ||
      k.toLowerCase().includes('experience')
    ));

    // 2. Experience Context Analysis
    const experienceContext = await getExperienceContext();
    console.log('🖼️ Experience Context:', experienceContext);

    // 3. Whop Auth Analysis  
    const whopUser = await getWhopUserFromHeaders();
    console.log('👤 Whop User from Headers:', whopUser);

    // 4. Current User Analysis
    const currentUser = await getCurrentUser();
    console.log('👤 Current User (from auth.ts):', currentUser);

    // 5. Admin Check
    const isAdminUser = await isAdmin();
    console.log('🔐 isAdmin() result:', isAdminUser);

    // 6. Environment Check
    const envCheck = {
      whopCompanyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      whopAppId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
      whopExperienceId: process.env.WHOP_EXPERIENCE_ID || process.env.NEXT_PUBLIC_WHOP_EXPERIENCE_ID,
      hasWhopApiKey: !!process.env.WHOP_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      enableDevAuth: process.env.ENABLE_DEV_AUTH
    };

    console.log('⚙️ Environment Configuration:', envCheck);

    // 7. Role Decision Analysis
    let roleDecision = {
      method: 'unknown',
      isCompanyOwner: false,
      isAdmin: false,
      reason: 'No valid detection method'
    };

    if (currentUser) {
      if (currentUser.role === 'ADMIN') {
        roleDecision = {
          method: 'database_role',
          isCompanyOwner: true,
          isAdmin: true,
          reason: `User has ADMIN role in database. Company ID: ${currentUser.whopCompanyId}`
        };
      } else {
        roleDecision = {
          method: 'database_role', 
          isCompanyOwner: false,
          isAdmin: false,
          reason: `User has ${currentUser.role} role in database`
        };
      }
    } else if (experienceContext.isCompanyOwner) {
      roleDecision = {
        method: 'experience_context',
        isCompanyOwner: true,
        isAdmin: false,
        reason: 'Experience context suggests company owner but no user in database'
      };
    } else if (whopUser?.userId) {
      roleDecision = {
        method: 'whop_headers',
        isCompanyOwner: false,
        isAdmin: false,
        reason: 'Whop user detected but not identified as company owner'
      };
    }

    const debugResult = {
      timestamp: new Date().toISOString(),
      headers: {
        relevant: Object.keys(allHeaders).filter(k => 
          k.toLowerCase().includes('whop') || 
          k.toLowerCase().includes('user') || 
          k.toLowerCase().includes('company')
        ).reduce((obj: Record<string, string>, key) => {
          obj[key] = allHeaders[key];
          return obj;
        }, {}),
        total: Object.keys(allHeaders).length
      },
      experienceContext,
      whopUser,
      currentUser: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        whopCompanyId: currentUser.whopCompanyId,
        whopUserId: currentUser.whopUserId,
        tenantId: currentUser.tenantId
      } : null,
      isAdminCheck: isAdminUser,
      environment: envCheck,
      roleDecision,
      recommendations: [] as string[]
    };

    // 8. Generate Recommendations
    if (!currentUser) {
      debugResult.recommendations.push('❌ No user found - check authentication flow');
    }
    
    if (!experienceContext.userId) {
      debugResult.recommendations.push('❌ No Experience user ID - check Whop headers');
    }
    
    if (!experienceContext.companyId) {
      debugResult.recommendations.push('❌ No Experience company ID - check Whop headers');
    }
    
    if (currentUser && experienceContext.userId && currentUser.whopUserId !== experienceContext.userId) {
      debugResult.recommendations.push('⚠️ User ID mismatch between database and Experience context');
    }
    
    if (currentUser && experienceContext.companyId && currentUser.whopCompanyId !== experienceContext.companyId) {
      debugResult.recommendations.push('⚠️ Company ID mismatch between database and Experience context');
    }
    
    if (experienceContext.companyId === envCheck.whopCompanyId) {
      debugResult.recommendations.push('✅ Company ID matches configured company - likely company owner');
    }
    
    if (!isAdminUser && experienceContext.isCompanyOwner) {
      debugResult.recommendations.push('🔧 Experience suggests company owner but isAdmin() returns false - check admin logic');
    }

    return NextResponse.json(debugResult, { status: 200 });

  } catch (error) {
    console.error('❌ Role detection debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
