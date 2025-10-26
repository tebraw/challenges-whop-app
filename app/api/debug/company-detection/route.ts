// app/api/debug/company-detection/route.ts
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk';
import { createCorsResponse } from '@/lib/cors';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 COMPANY OWNER DETECTION DEBUG');
    
    const headersList = await headers();
    
    // Extract all relevant headers
    const allHeaders = {
      'x-whop-user-token': headersList.get('x-whop-user-token'),
      'x-whop-user-id': headersList.get('x-whop-user-id'),
      'x-whop-company-id': headersList.get('x-whop-company-id'),
      'x-company-id': headersList.get('x-company-id'),
      'x-whop-experience-id': headersList.get('x-whop-experience-id'),
      'x-experience-id': headersList.get('x-experience-id'),
      'x-frame-options': headersList.get('x-frame-options'),
      'referer': headersList.get('referer'),
      'user-agent': headersList.get('user-agent')
    };
    
    console.log('📋 All Headers:', allHeaders);
    
    // Try to extract user and company
    let userId = null;
    let companyId = headersList.get('x-whop-company-id') || 
                    headersList.get('x-company-id');
    
    // Try token verification
    if (allHeaders['x-whop-user-token']) {
      try {
        const tokenResult = await whopSdk.verifyUserToken(headersList);
        userId = tokenResult.userId;
        console.log('✅ Token verification successful:', userId);
      } catch (error) {
        console.log('❌ Token verification failed:', error);
        userId = headersList.get('x-whop-user-id');
      }
    } else {
      userId = headersList.get('x-whop-user-id');
    }
    
    // Check company access if we have both
    let companyAccessResult = null;
    if (userId && companyId) {
      try {
        companyAccessResult = await whopSdk.access.checkIfUserHasAccessToCompany({
          userId,
          companyId
        });
        console.log('🔑 Company Access Result:', companyAccessResult);
      } catch (error) {
        console.log('❌ Company access check failed:', error);
        companyAccessResult = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    // Determine what the user should be classified as
    let userClassification = 'unknown';
    let shouldGetAdminAccess = false;
    
    if (companyId) {
      if (companyAccessResult?.hasAccess) {
        userClassification = 'company_owner_with_access';
        shouldGetAdminAccess = true;
      } else if (companyId && userId) {
        userClassification = 'has_company_id_assume_owner';
        shouldGetAdminAccess = true;
      } else {
        userClassification = 'has_company_id_no_user';
        shouldGetAdminAccess = false;
      }
    } else if (allHeaders['x-whop-experience-id']) {
      userClassification = 'experience_member';
      shouldGetAdminAccess = false;
    }
    
    return createCorsResponse({
      success: true,
      debug: {
        headers: allHeaders,
        extracted: {
          userId,
          companyId,
          experienceId: allHeaders['x-whop-experience-id']
        },
        companyAccess: companyAccessResult,
        classification: {
          userType: userClassification,
          shouldGetAdminAccess,
          recommendedRedirect: shouldGetAdminAccess ? '/admin' : '/experiences/[experienceId]'
        },
        environment: {
          isWhopRequest: !!(allHeaders['x-whop-user-token'] || allHeaders['x-whop-experience-id']),
          isIframe: !!allHeaders['x-frame-options'],
          refererContainsWhop: allHeaders['referer']?.includes('whop.com') || false
        }
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return createCorsResponse({ 
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
}
