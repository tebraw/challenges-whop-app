import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk';
import { createCorsResponse } from '@/lib/cors';
import { getExperienceContext } from '@/lib/whop-experience';

// Helper to extract company context
async function getCompanyFromExperience() {
  const headersList = await headers();
  
  // Method 1: Direct header approach
  let companyId = headersList.get('x-whop-company-id') || 
                  headersList.get('x-company-id') || '';
  
  // Method 2: Extract from app config cookie if headers missing
  if (!companyId) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const appConfigCookie = cookieStore.get('whop.app-config')?.value;
    if (appConfigCookie) {
      try {
        const appConfig = JSON.parse(atob(appConfigCookie.split('.')[1]));
        companyId = appConfig.did;
      } catch (error) {
        console.log('Failed to parse app config for company ID');
      }
    }
  }
  
  // Method 3: Get experienceId for access checks (optional)
  const experienceId = headersList.get('x-experience-id') || 
                      headersList.get('experience-id') ||
                      headersList.get('x-whop-experience-id') ||
                      undefined;
  
  console.log('🔍 Context extraction:', {
    companyId,
    experienceId,
    hasCompanyHeader: !!headersList.get('x-whop-company-id'),
    hasExperienceHeader: !!headersList.get('x-experience-id')
  });
  
  return { companyId, experienceId };
}

export async function GET(request: NextRequest) {
  try {
    console.log('Admin challenges API called');
    
    // DEV MODE: Return mock data for localhost testing
    if (process.env.NODE_ENV === 'development') {
      const headersList = await headers();
      const host = headersList.get('host');
      
      if (host && host.includes('localhost')) {
        console.log('🔧 DEV MODE: Using mock admin access for localhost');
        
        // Return any challenges from the database for testing
        try {
          const challenges = await prisma.challenge.findMany({
            include: {
              _count: {
                select: { enrollments: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          });
          
          return createCorsResponse(challenges);
        } catch (error) {
          console.error('DEV MODE database error:', error);
          return createCorsResponse([]);
        }
      }
    }
    
    // Step 1: Extract user ID with fallbacks
    const headersList = await headers();
    
    console.log('Headers received:', {
      'x-whop-user-token': headersList.get('x-whop-user-token') ? 'present' : 'missing',
      'x-whop-user-id': headersList.get('x-whop-user-id'),
      'x-whop-company-id': headersList.get('x-whop-company-id'),
      'x-experience-id': headersList.get('x-experience-id'),
      authorization: headersList.get('authorization') ? 'present' : 'missing'
    });

    let userId: string | null = null;
    
    // Try Whop SDK verification first
    try {
      const tokenResult = await whopSdk.verifyUserToken(headersList);
      userId = tokenResult.userId;
      console.log('✅ Whop token verification successful:', userId);
    } catch (error) {
      console.log('❌ Whop token verification failed, trying fallback');
      
      // Fallback: Extract from headers directly
      userId = headersList.get('x-whop-user-id') || 
               headersList.get('x-user-id') || 
               null;
      
      if (userId) {
        console.log('🔄 Using fallback userId from headers:', userId);
      }
    }

    if (!userId) {
      return createCorsResponse({ 
        error: 'Authentication required - please login via Whop',
        debug: 'No valid Whop token or user ID found'
      }, 401);
    }

    // Step 2: Smart context detection - Company Owner vs Experience Member
    const experienceId = headersList.get('x-experience-id') || 
                        headersList.get('experience-id') ||
                        headersList.get('x-whop-experience-id') ||
                        undefined;
    
    // Try to get company ID from multiple sources: headers AND experience context
    const companyIdFromHeaders = headersList.get('x-whop-company-id') || 
                                headersList.get('x-company-id') || 
                                undefined;
    
    // BUSINESS DASHBOARD FIX: Also try to extract from experience context
    const experienceContext = await getExperienceContext();
    const companyIdFromContext = experienceContext?.companyId;
    
    console.log('🔍 ADMIN CHALLENGES DEBUG:', {
      companyIdFromHeaders,
      companyIdFromContext,
      fullExperienceContext: experienceContext
    });
    
    const companyId = companyIdFromHeaders || companyIdFromContext || undefined;
    
    // 🎯 CRITICAL: Company Owner (App Installer) vs Experience Member detection
    const isCompanyOwner = !!companyId; // Any valid company ID indicates company owner
    const isExperienceMember = !!experienceId && !companyId;
    
    console.log('🔍 User context:', {
      userId,
      experienceId,
      companyId,
      companyIdFromHeaders,
      companyIdFromContext,
      isCompanyOwner,
      isExperienceMember,
      allCompanyHeaders: {
        'x-whop-company-id': headersList.get('x-whop-company-id'),
        'x-company-id': headersList.get('x-company-id'),
        'company-id': headersList.get('company-id')
      }
    });
    
    // Company Owner gets admin access with company ID (from headers OR context)
    if (isCompanyOwner) {
      console.log('🎯 Company Owner detected - granting admin access');
    } else if (!experienceId && !companyId) {
      return createCorsResponse({ 
        error: 'Context required',
        debug: 'Neither experienceId nor companyId found - please access via Whop app',
        userId,
        headers: {
          'x-experience-id': headersList.get('x-experience-id'),
          'x-whop-experience-id': headersList.get('x-whop-experience-id')
        }
      }, 400);
    }

    console.log('🎭 Experience-based isolation:', experienceId);

    // Step 3: WHOP RECOMMENDED AUTH FLOW (skip for Company Owners)
    let hasAdminAccess = false;
    let accessLevel = 'no_access';
    
    if (isCompanyOwner) {
      // Company Owner gets automatic admin access
      hasAdminAccess = true;
      accessLevel = 'admin';
      console.log('✅ Company Owner admin access granted');
    } else {
      try {
        const experienceAccessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
          userId,
          experienceId: experienceId!
        });
        hasAdminAccess = experienceAccessResult.hasAccess;
        accessLevel = experienceAccessResult.accessLevel;
        console.log('✅ Experience access check:', experienceAccessResult);
        
        // WHOP ROLE MAPPING: admin = ersteller, customer = member, no_access = guest
        if (accessLevel !== 'admin') {
          return createCorsResponse({ 
            error: 'Admin access required',
            debug: `User ${userId} has accessLevel '${accessLevel}' but needs 'admin' for this action`,
            accessLevel,
            experienceId
          }, 403);
        }
        
      } catch (error) {
        console.log('❌ Experience access check failed:', error);
        return createCorsResponse({ 
          error: 'Experience access verification failed',
          debug: `Could not verify access for experienceId: ${experienceId}`,
          experienceId
        }, 403);
      }
    }

    console.log('✅ Admin access verified for user:', userId, 'context:', experienceId || companyId);

    // Step 4: CONTEXT-SCOPED TENANT (Company Owner vs Experience Member)
    const tenantId = experienceId || companyId!; // Use experience for members, company for owners
    
    let tenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: tenantId }
    });
    
    if (!tenant) {
      const tenantName = isCompanyOwner 
        ? `Company ${companyId}` 
        : `Experience ${experienceId}`;
      
      console.log(`🏗️ Creating new tenant for: ${tenantName}`);
      
      try {
        tenant = await prisma.tenant.create({
          data: {
            name: tenantName,
            whopCompanyId: tenantId
          }
        });
        console.log(`✅ Created new tenant with ID: ${tenant.id}`);
      } catch (error) {
        console.error('Failed to create tenant:', error);
        return createCorsResponse({ 
          error: 'Failed to create tenant',
          debug: `Could not create tenant for: ${tenantName}`,
          originalError: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    } else {
      console.log(`✅ Found existing tenant with ID: ${tenant.id}`);
    }

    // Step 5: OPTIMIZED CHALLENGE QUERIES (No enrollments/checkins for list view)
    const whereClause = isCompanyOwner 
      ? {
          tenantId: tenant.id
        }
      : {
          tenantId: tenant.id,
          experienceId: experienceId
        };

    const challenges = await prisma.challenge.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            enrollments: true,
            winners: true
          }
        }
        // � REMOVED: enrollments.checkins to prevent 5MB response
        // Note: Individual challenge details load this data separately
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📋 Returning ${challenges.length} challenges for ${isCompanyOwner ? 'company' : 'experience'}: ${tenantId}`);

    return createCorsResponse({
      success: true,
      challenges: challenges.map((challenge: any) => {
        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          imageUrl: challenge.imageUrl,
          category: challenge.whopCategoryName || 'general',
          difficulty: (challenge.rules as any)?.difficulty || 'BEGINNER',
          startAt: challenge.startAt,
          endAt: challenge.endAt,
          enrollmentCount: challenge._count.enrollments,
          winnersCount: challenge._count.winners,
          streakCount: 0, // Will be calculated in individual challenge view
          isActive: new Date() >= challenge.startAt && new Date() <= challenge.endAt,
          createdAt: challenge.createdAt
        };
      }),
      context: {
        experienceId,
        companyId,
        userId,
        accessLevel,
        isCompanyOwner
      }
    });

  } catch (error) {
    console.error('Admin challenges API error:', error);
    return createCorsResponse({ 
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}