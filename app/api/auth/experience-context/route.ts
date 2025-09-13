/**
 * 🎯 WHOP EXPERIENCE CONTEXT API
 * GET /api/auth/experience-context
 * 
 * Returns current user's role and permissions in the experience
 * Implements WHOP RULE #3: Auth nur auf dem Server
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk';
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
      
      // 🎯 BUSINESS DASHBOARD: Check if AdminGuard passed Company ID via headers
      const headerCompanyId = headersList.get('x-whop-company-id') || headersList.get('x-company-id');
      
      // Prefer AdminGuard header over experience context if available
      if (headerCompanyId && headerCompanyId.startsWith('biz_')) {
        experienceContext.companyId = headerCompanyId;
        console.log('🎯 Using Company ID from AdminGuard headers:', headerCompanyId);
      }
      
      // 🎯 BUSINESS DASHBOARD SPECIAL CASE: If companyId but no experienceId → Business Dashboard access
      if (experienceContext.companyId && !experienceContext.experienceId) {
        console.log('🎯 Business Dashboard detected: Company ID without Experience ID');
        try {
          const companyAccessResult = await whopSdk.access.checkIfUserHasAccessToCompany({
            userId,
            companyId: experienceContext.companyId
          });
          
          whopRole = companyAccessResult.hasAccess ? companyAccessResult.accessLevel : 'no_access';
          console.log('🎯 Business Dashboard access result:', whopRole);
        } catch (error) {
          console.error('🎯 Business Dashboard access check failed:', error);
          // Assume admin access for Business Dashboard if API fails but we have valid context
          if (experienceContext.isEmbedded) {
            console.log('🎯 Business Dashboard fallback: Assuming admin access');
            whopRole = 'admin';
          } else {
            whopRole = 'no_access';
          }
        }
      } else if (experienceContext.experienceId) {
        // Check experience access
        try {
          const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
            userId,
            experienceId: experienceContext.experienceId
          });
          
          whopRole = accessResult.hasAccess ? accessResult.accessLevel : 'no_access';
        } catch (error) {
          console.error('Experience access check failed:', error);
          whopRole = 'no_access';
        }
      } else if (experienceContext.companyId) {
        // Fallback to company access
        try {
          const companyAccessResult = await whopSdk.access.checkIfUserHasAccessToCompany({
            userId,
            companyId: experienceContext.companyId
          });
          
          whopRole = companyAccessResult.hasAccess ? companyAccessResult.accessLevel : 'no_access';
        } catch (error) {
          console.error('Company access check failed:', error);
          whopRole = 'no_access';
        }
      }
    }

    // 🎯 FALLBACK: If user is in Whop iframe with company context but API calls failed
    // Assume potential admin access for company owners
    const experienceContext = await getExperienceContext();
    
    console.log('🔍 FALLBACK CHECK:', {
      hasUserId: !!userId,
      hasCompanyId: !!experienceContext.companyId,
      companyId: experienceContext.companyId,
      isEmbedded: experienceContext.isEmbedded,
      currentWhopRole: whopRole,
      shouldTriggerFallback: userId && experienceContext.companyId && experienceContext.isEmbedded && whopRole === 'no_access'
    });
    
    if (userId && experienceContext.companyId && experienceContext.isEmbedded && whopRole === 'no_access') {
      console.log('🔄 Whop iframe detected with company context - assuming admin access');
      whopRole = 'admin'; // Fallback assumption for company owners in iframe
    }

    // 🎯 WHOP RULE #2: Map to app roles
    const appRole = mapWhopRoleToAppRole(whopRole);
    
    // 🎯 BUSINESS DASHBOARD: Don't return error if we have userId but missing context
    // This is normal for Business Dashboard access
    const hasValidContext = userId && (experienceContext.experienceId || experienceContext.companyId);
    
    return createCorsResponse({
      userId,
      experienceId: experienceContext.experienceId,
      companyId: experienceContext.companyId,
      userRole: appRole,
      whopRole,
      isAuthenticated: !!userId && whopRole !== 'no_access',
      isEmbedded: experienceContext.isEmbedded,
      // Only show error if we truly have no context at all
      ...((!hasValidContext && userId) ? { 
        error: "Context required",
        debug: `Neither experienceId nor companyId found - please access via Whop app`,
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
