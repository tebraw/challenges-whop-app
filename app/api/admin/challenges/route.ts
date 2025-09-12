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

    // Step 2: Get company context (required)
    const { companyId, experienceId } = await getCompanyFromExperience();
    
    if (!companyId || companyId.trim() === '') {
      return createCorsResponse({ 
        error: 'Company context required',
        debug: 'No valid companyId found in headers or environment - all requests must have company context',
        userId,
        headers: {
          'x-whop-company-id': headersList.get('x-whop-company-id'),
          'x-company-id': headersList.get('x-company-id')
        }
      }, 400);
    }
    
    console.log(`🏢 Valid company context: ${companyId}`);
    
    // Step 3: Flexible admin access check - works with or without experienceId
    let hasAdminAccess = false;
    let accessLevel = 'no_access';
    
    // Try experience access first if available
    if (experienceId) {
      try {
        const experienceAccessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
          userId,
          experienceId
        });
        hasAdminAccess = experienceAccessResult.hasAccess;
        accessLevel = experienceAccessResult.accessLevel;
        console.log('✅ Experience access check:', experienceAccessResult);
      } catch (error) {
        console.log('❌ Experience access check failed:', error);
      }
    }
    
    // Try company access if experience check failed or no experienceId
    if (!hasAdminAccess) {
      try {
        const companyAccessResult = await whopSdk.access.checkIfUserHasAccessToCompany({
          userId,
          companyId
        });
        hasAdminAccess = companyAccessResult.hasAccess;
        accessLevel = companyAccessResult.accessLevel;
        console.log('✅ Company access check:', companyAccessResult);
      } catch (error) {
        console.log('❌ Company access check failed:', error);
        
        // Ultimate fallback for Whop iframe contexts
        const referer = headersList.get('referer') || '';
        const isWhopIframe = referer.includes('whop.com') || 
                            headersList.get('x-frame-options') !== null;
        
        if (isWhopIframe && userId && companyId) {
          console.log('🔄 Using Whop iframe fallback - assuming admin access');
          hasAdminAccess = true;
          accessLevel = 'admin';
        }
      }
    }
    
    if (!hasAdminAccess) {
      return createCorsResponse({ 
        error: 'Admin access required',
        debug: `User ${userId} does not have access to company ${companyId}${experienceId ? ` or experience ${experienceId}` : ''}`,
        accessLevel,
        companyId,
        experienceId: experienceId || 'not_provided'
      }, 403);
    }

    console.log('✅ Admin access verified for user:', userId, 'company:', companyId, 'experience:', experienceId || 'not_provided');

    // Step 4: Get or create tenant based on company (with strict validation)
    if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
      return createCorsResponse({ 
        error: 'Invalid company ID',
        debug: 'Company ID must be a non-empty string',
        companyId: typeof companyId
      }, 400);
    }
    
    let tenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: companyId }
    });
    
    if (!tenant) {
      console.log(`🏗️ Creating new tenant for companyId: ${companyId}`);
      
      try {
        tenant = await prisma.tenant.create({
          data: {
            name: `Company ${companyId}`,
            whopCompanyId: companyId
          }
        });
        console.log(`✅ Created new tenant with ID: ${tenant.id} for company: ${companyId}`);
      } catch (error) {
        console.error('Failed to create tenant:', error);
        return createCorsResponse({ 
          error: 'Failed to create tenant for company',
          debug: `Could not create tenant for companyId: ${companyId}`,
          originalError: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    } else {
      console.log(`✅ Found existing tenant with ID: ${tenant.id} for company: ${companyId}`);
    }
    
    // Additional security check: Ensure tenant has the correct company ID
    if (tenant.whopCompanyId !== companyId) {
      console.error(`🚨 Security violation: Tenant ${tenant.id} has company ${tenant.whopCompanyId} but request for ${companyId}`);
      return createCorsResponse({ 
        error: 'Company mismatch',
        debug: 'Tenant company ID does not match request company ID'
      }, 403);
    }

    // Step 5: Fetch challenges for this company's tenant with additional security
    const challenges = await prisma.challenge.findMany({
      where: {
        tenantId: tenant.id,
        // 🔒 SECURITY: Double-check whopCompanyId matches for extra protection
        whopCompanyId: companyId
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

    console.log(`📋 Returning ${challenges.length} challenges for tenant ${tenant.id}`);

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
        experienceId: experienceId || 'not_provided',
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