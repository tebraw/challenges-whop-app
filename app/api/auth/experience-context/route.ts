/**
 * 🎯 WHOP EXPERIENCE CONTEXT API
 * GET /api/auth/experience-context
 * 
 * Returns current user's role and permissions in the experience
 * Implements WHOP RULE #3: Auth nur auf dem Server
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk, whopAppSdk, whopCompanySdk } from '@/lib/whop-sdk-unified';
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
      const tokenResult = await whopAppSdk.verifyUserToken(headersList);
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
      
      // 🎯 EXPERIENCE-ONLY LOGIC: Extract experienceId from URL if headers missing
      if (!experienceContext.experienceId) {
        const referer = headersList.get('referer') || '';
        const urlMatch = referer.match(/\/experiences\/([^\/]+)/);
        if (urlMatch) {
          experienceContext.experienceId = urlMatch[1];
          console.log('🔄 Extracted experienceId from URL:', experienceContext.experienceId);
        }
      }
      
      // 🎯 EXPERIENCE ACCESS CHECK ONLY
      if (experienceContext.experienceId) {
        try {
          const accessResult = await whopAppSdk.access.checkIfUserHasAccessToExperience({
            userId,
            experienceId: experienceContext.experienceId
          });
          
          whopRole = accessResult.hasAccess ? accessResult.accessLevel : 'no_access';
          console.log('✅ Experience access check result:', whopRole);
        } catch (error) {
          console.error('❌ Experience access check failed:', error);
          whopRole = 'no_access';
        }
      } else {
        console.log('⚠️ No experienceId found - Experience Context requires Experience ID');
        whopRole = 'no_access';
      }
    }

    // 🎯 WHOP RULE #2: Map to app roles
    const appRole = mapWhopRoleToAppRole(whopRole);
    
    // Get final experience context
    const experienceContext = await getExperienceContext();
    
    // 🎯 EXPERIENCE-ONLY RESPONSE: Only return Experience context
    return createCorsResponse({
      userId,
      experienceId: experienceContext.experienceId,
      companyId: null, // Experience Context doesn't need Company ID
      userRole: appRole,
      whopRole,
      isAuthenticated: !!userId && whopRole !== 'no_access',
      isEmbedded: experienceContext.isEmbedded,
      // Show error only if no experienceId found
      ...((!experienceContext.experienceId && userId) ? { 
        error: "Experience context required",
        debug: `No experienceId found - please access via Experience URL`,
        headers: {
          "x-experience-id": experienceContext.experienceId || null,
          "x-whop-experience-id": experienceContext.experienceId || null
        }
      } : {})
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
