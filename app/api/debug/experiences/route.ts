import { NextRequest, NextResponse } from 'next/server';
import { whopAppSdk } from '@/lib/whop-sdk-dual';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Experience Discovery...');
    
    // Get headers
    const headersList = await headers();
    
    // Try to get user info
    let userId = null;
    try {
      const { userId: extractedUserId } = await whopAppSdk.verifyUserToken(headersList);
      userId = extractedUserId;
      console.log('👤 User ID:', userId);
    } catch (error) {
      console.log('⚠️ No valid user token found');
    }

    // Check if user is accessing from an experience context
    const experienceId = headersList.get('x-whop-experience-id') || 
                         headersList.get('X-Whop-Experience-Id') || 
                         headersList.get('x-experience-id');
    
    console.log('🎭 Experience ID from headers:', experienceId);

    // Extract company ID from experience ID (same logic as main auth)
    let companyId = process.env.WHOP_COMPANY_ID || 'default_company';
    if (experienceId) {
      companyId = `biz_${experienceId.replace('exp_', '')}`;
      console.log(`🎯 Extracted company ID: ${experienceId} → ${companyId}`);
    }
    
    const debugInfo: any = {
      userId,
      companyId,
      experienceId,
      headers: {
        'x-whop-experience-id': headersList.get('x-whop-experience-id'),
        'x-whop-company-id': headersList.get('x-whop-company-id'),
        'x-whop-user-id': headersList.get('x-whop-user-id'),
        'x-whop-membership-id': headersList.get('x-whop-membership-id'),
      },
      suggestions: {
        experienceUrl: experienceId ? `/experiences/${experienceId}` : 'No experience ID found',
        dashboardUrl: `/dashboard/${companyId}`,
        note: 'Community Members should access via Experience Views, not Dashboard Views'
      }
    };

    // If we have an experience ID, test access
    if (experienceId && userId) {
      try {
        const experienceAccess = await whopAppSdk.access.checkIfUserHasAccessToExperience({
          userId,
          experienceId
        });
        
        debugInfo.experienceAccess = experienceAccess;
        
        return NextResponse.json({
          success: true,
          ...debugInfo,
          recommendation: experienceAccess.accessLevel === 'customer' 
            ? `✅ Customer should use: /experiences/${experienceId}`
            : experienceAccess.accessLevel === 'admin'
            ? `✅ Admin should use: /dashboard/${companyId}`
            : '❌ No access to this experience',
          timestamp: new Date().toISOString()
        });
        
      } catch (error: any) {
        debugInfo.experienceAccessError = error?.message;
      }
    }
    
    // Also test company access  
    if (userId) {
      try {
        const companyAccess = await whopAppSdk.access.checkIfUserHasAccessToCompany({
          userId,
          companyId
        });
        
        debugInfo.companyAccess = companyAccess;
        
      } catch (error: any) {
        debugInfo.companyAccessError = error?.message;
      }
    }
    
    return NextResponse.json({
      success: true,
      ...debugInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Experience discovery failed:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
