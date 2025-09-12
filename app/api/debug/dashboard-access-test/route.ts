import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';
import { headers, cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Testing Dashboard Access Level Detection...');
    
    // Get headers and cookies
    const headersList = await headers();
    const cookieStore = await cookies();
    
    // Extract companyId from URL or derive from experience ID
    const url = new URL(req.url);
    const experienceId = headersList.get('x-experience-id');
    let companyId = url.searchParams.get('companyId');
    
    // If no companyId provided, try to extract from experience ID
    if (!companyId && experienceId) {
      companyId = `biz_${experienceId.replace('exp_', '')}`;
      console.log(`🎯 Extracted company ID: ${experienceId} → ${companyId}`);
    }
    
    // Final fallback
    if (!companyId) {
      companyId = process.env.WHOP_COMPANY_ID || 'default_company';
    }
    
    // Check for user token in headers and cookies
    const whopUserToken = headersList.get('x-whop-user-token') || cookieStore.get('whop_user_token')?.value;
    
    if (!whopUserToken) {
      return NextResponse.json({
        success: false,
        error: 'No Whop user token found in headers or cookies',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('🎯 Found user token, verifying...');
    
    // Verify user token
    const { userId } = await whopSdk.verifyUserToken(headersList);
    console.log('👤 User ID:', userId);
    console.log('🏢 Company ID:', companyId);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Failed to verify user token',
        timestamp: new Date().toISOString()
      });
    }
    
    // Test company access level check
    const accessResult = await whopSdk.access.checkIfUserHasAccessToCompany({
      userId,
      companyId
    });
    
    console.log('✅ Company Access Result:', accessResult);
    
    // Determine role based on access level
    const isAdmin = accessResult.accessLevel === 'admin';
    const shouldBeRole = isAdmin ? 'ADMIN' : 'USER';
    
    return NextResponse.json({
      success: true,
      userId,
      companyId,
      whopAccessResult: accessResult,
      interpretation: {
        accessLevel: accessResult.accessLevel,
        isAdmin,
        shouldBeRole,
        canAccessDashboard: isAdmin,
        explanation: {
          'admin': 'Company Owner/Admin → Can access Dashboard',
          'customer': 'Community Member → Experience View only',
          'no_access': 'No access → Not allowed'
        }[accessResult.accessLevel] || 'Unknown access level'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Dashboard access test failed:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });
  }
}
