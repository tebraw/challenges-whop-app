/**
 * 🎯 WHOP EXPERIENCE CONTEXT API
 * GET /api/auth/experience-context
 * 
 * Returns current user's role and permissions in the experience
 * Implements WHOP RULE #3: Auth nur auf dem Server
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk-dual';
import { getExperienceContext } from '@/lib/whop-experience';
import { createCorsResponse, handleCorsPreflightOptions } from '@/lib/cors';

// 🎯 WHOP RULE #2: Rollen sauber mappen
function mapWhopRoleToAppRole(whopRole: string): 'ersteller' | 'member' | 'guest' {
  switch (whopRole) {
    case 'admin':
      return 'ersteller';  // Company Owner/Moderator
    case 'customer':
      return 'member';     // Community Member
    case 'no_access':
    default:
      return 'guest';      // No access
  }
}

export async function GET(request: NextRequest) {
  try {
    // 🎯 WHOP RULE #3: Server-side auth validation
    const headersList = await headers();
    
    console.log('Experience context API called');
    console.log('Headers available:', {
      experienceId: headersList.get('x-experience-id'),
      companyId: headersList.get('x-whop-company-id'),
      authorization: headersList.get('authorization') ? 'present' : 'missing'
    });
    
    // Try to verify user token
    let userId: string | null = null;
    let whopRole: string = 'no_access';
    
    try {
      // Official Whop pattern: Universal SDK with App API Key + onBehalfOfUserId
      const tokenResult = await whopSdk.verifyUserToken(headersList);
      userId = tokenResult.userId;
      console.log('✅ Whop token verification successful:', userId);
    } catch (error) {
      console.log('❌ Whop token verification failed, trying fallback methods');
      
      // 🎯 FALLBACK: Extract userId from experience context
      const experienceContext = await getExperienceContext();
      if (experienceContext.userId) {
        userId = experienceContext.userId;
        console.log('🔄 Using userId from experience context:', userId);
      }
    }

    if (userId) {
      // Get Experience context
      const experienceContext = await getExperienceContext();
      
      console.log('🎭 Experience Context detected:', {
        experienceId: experienceContext.experienceId,
        companyId: experienceContext.companyId,
        isEmbedded: experienceContext.isEmbedded,
        userId
      });
      
      // � EXPERIENCE ACCESS: Prioritize Experience ID over Company ID
      if (experienceContext.experienceId) {
        console.log('🎯 Checking Experience access for:', experienceContext.experienceId);
        try {
          // OFFICIAL WHOP PATTERN: Check Experience access first
          const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
            userId,
            experienceId: experienceContext.experienceId
          });
          
          whopRole = accessResult.hasAccess ? accessResult.accessLevel : 'no_access';
          console.log('✅ Experience access result:', { whopRole, hasAccess: accessResult.hasAccess });
        } catch (error) {
          console.error('❌ Experience access check failed:', error);
          whopRole = 'no_access';
        }
      } else if (experienceContext.companyId) {
        // � BUSINESS DASHBOARD: Only if NO Experience ID
        console.log('🎯 No Experience ID - checking Company access for:', experienceContext.companyId);
        try {
          const companyAccessResult = await whopSdk.access.checkIfUserHasAccessToCompany({
            userId,
            companyId: experienceContext.companyId
          });
          
          whopRole = companyAccessResult.hasAccess ? companyAccessResult.accessLevel : 'no_access';
          console.log('✅ Company access result:', { whopRole, hasAccess: companyAccessResult.hasAccess });
        } catch (error) {
          console.error('❌ Company access check failed:', error);
          whopRole = 'no_access';
        }
      } else {
        console.log('❌ No Experience ID or Company ID found');
        whopRole = 'no_access';
      }
    }

    // Get Experience context for all responses
    const currentExperienceContext = await getExperienceContext();

    // 🎯 WHOP RULE #2: Map to app roles
    const appRole = mapWhopRoleToAppRole(whopRole);
    
    console.log('🎭 Final Experience Context:', {
      userId,
      experienceId: currentExperienceContext.experienceId,
      companyId: currentExperienceContext.companyId,
      whopRole,
      appRole,
      isAuthenticated: !!userId && whopRole !== 'no_access'
    });
    
    return createCorsResponse({
      userId,
      experienceId: currentExperienceContext.experienceId,
      companyId: currentExperienceContext.companyId,
      userRole: appRole,
      whopRole,
      isAuthenticated: !!userId && whopRole !== 'no_access',
      isEmbedded: currentExperienceContext.isEmbedded || false
    });

  } catch (error) {
    console.error('Experience context API error:', error);
    
    // Return guest context on error
    return createCorsResponse({
      userId: null,
      experienceId: null,
      companyId: null,
      userRole: 'guest',
      whopRole: 'no_access',
      isAuthenticated: false,
      isEmbedded: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCorsPreflightOptions();
}
