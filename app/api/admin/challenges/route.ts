import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk';
import { createCorsResponse } from '@/lib/cors';

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

    // Step 2: Get experienceId (WHOP BEST PRACTICE!)
    const experienceId = headersList.get('x-experience-id') || 
                        headersList.get('experience-id') ||
                        headersList.get('x-whop-experience-id') ||
                        undefined;
    
    if (!experienceId) {
      return createCorsResponse({ 
        error: 'Experience context required',
        debug: 'No experienceId found in headers - this is required for proper tenant isolation',
        userId,
        headers: {
          'x-experience-id': headersList.get('x-experience-id'),
          'x-whop-experience-id': headersList.get('x-whop-experience-id')
        }
      }, 400);
    }

    console.log(`� Experience-based isolation: ${experienceId}`);

    // Step 3: WHOP RECOMMENDED AUTH FLOW
    let hasAdminAccess = false;
    let accessLevel = 'no_access';
    
    try {
      const experienceAccessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
        userId,
        experienceId
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

    console.log('✅ Admin access verified for user:', userId, 'experience:', experienceId);

    // Step 4: EXPERIENCE-SCOPED TENANT (Whop Best Practice)
    let tenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: experienceId } // Use experienceId as the unique identifier
    });
    
    if (!tenant) {
      console.log(`🏗️ Creating new experience-scoped tenant for: ${experienceId}`);
      
      try {
        tenant = await prisma.tenant.create({
          data: {
            name: `Experience ${experienceId}`,
            whopCompanyId: experienceId // Store experienceId as the company identifier
          }
        });
        console.log(`✅ Created new experience tenant with ID: ${tenant.id}`);
      } catch (error) {
        console.error('Failed to create experience tenant:', error);
        return createCorsResponse({ 
          error: 'Failed to create experience tenant',
          debug: `Could not create tenant for experienceId: ${experienceId}`,
          originalError: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    } else {
      console.log(`✅ Found existing experience tenant with ID: ${tenant.id}`);
    }

    // Step 5: EXPERIENCE-SCOPED CHALLENGE QUERIES (Perfect Isolation)
    const challenges = await prisma.challenge.findMany({
      where: {
        tenantId: tenant.id,
        // 🔒 DOUBLE SECURITY: Experience-based isolation
        experienceId: experienceId
      },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📋 Returning ${challenges.length} challenges for experience ${experienceId}`);

    return createCorsResponse({
      success: true,
      challenges: challenges.map(challenge => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        imageUrl: challenge.imageUrl,
        category: challenge.category,
        difficulty: challenge.difficulty,
        startDate: challenge.startAt,
        endDate: challenge.endAt,
        enrollmentCount: challenge._count.enrollments,
        isActive: new Date() >= challenge.startAt && new Date() <= challenge.endAt,
        createdAt: challenge.createdAt
      })),
      context: {
        experienceId,
        userId,
        accessLevel
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