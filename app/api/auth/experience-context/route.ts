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
    
    // Try to verify user token
    let userId: string | null = null;
    let whopRole: string = 'no_access';
    
    try {
      const tokenResult = await whopSdk.verifyUserToken(headersList);
      userId = tokenResult.userId;
    } catch (error) {
      // No valid token - user is guest
      console.log('No valid Whop token found, treating as guest');
    }

    if (userId) {
      // Get Experience context
      const experienceContext = await getExperienceContext();
      
      if (experienceContext.experienceId) {
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

    // 🎯 WHOP RULE #2: Map to app roles
    const appRole = mapWhopRoleToAppRole(whopRole);
    
    const experienceContext = await getExperienceContext();
    
    return NextResponse.json({
      userId,
      experienceId: experienceContext.experienceId,
      companyId: experienceContext.companyId,
      userRole: appRole,
      whopRole,
      isAuthenticated: !!userId && whopRole !== 'no_access',
      isEmbedded: experienceContext.isEmbedded
    });

  } catch (error) {
    console.error('Experience context API error:', error);
    
    // Return guest context on error
    return NextResponse.json({
      userId: null,
      experienceId: null,
      companyId: null,
      userRole: 'guest',
      whopRole: 'no_access',
      isAuthenticated: false,
      isEmbedded: false
    });
  }
}
