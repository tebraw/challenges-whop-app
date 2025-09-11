import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk';
import { headers } from 'next/headers';
import { createCorsResponse, handleCorsPreflightOptions } from '@/lib/cors';

// Helper: Get Company Context from Experience
async function getCompanyFromExperience() {
  const headersList = await headers();
  
  // Method 1: Get companyId directly from headers
  let companyId = headersList.get('x-whop-company-id') || 
                  headersList.get('x-company-id') ||
                  process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
  
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
  
  // Method 3: Get experienceId for access checks
  const experienceId = headersList.get('x-experience-id') || 
                      headersList.get('experience-id') ||
                      process.env.WHOP_EXPERIENCE_ID;
  
  return { companyId, experienceId };
}

// WHOP RULE: Experience-scoped admin access with proper role checking
export async function GET(request: NextRequest) {
  try {
    console.log('Admin challenges API called');
    
    // Step 1: Verify Whop token
    const headersList = await headers();
    const { userId } = await whopSdk.verifyUserToken(headersList);
    
    if (!userId) {
      return createCorsResponse({ 
        error: 'Authentication required - please login via Whop',
        debug: 'No valid Whop token found'
      }, 401);
    }

    // Step 2: Get company and experience context
    const { companyId, experienceId } = await getCompanyFromExperience();
    
    if (!companyId) {
      return createCorsResponse({ 
        error: 'Company context required',
        debug: 'No companyId found in headers or environment'
      }, 400);
    }
    
    if (!experienceId) {
      return createCorsResponse({ 
        error: 'Experience context required',
        debug: 'No experienceId found in headers or environment'
      }, 400);
    }

    // Step 3: Check experience access and role
    const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId
    });

    if (!accessResult.hasAccess) {
      return createCorsResponse({ 
        error: 'Access denied to experience',
        debug: 'User does not have access to this experience'
      }, 403);
    }

    // Step 4: Admin role required for this endpoint
    if (accessResult.accessLevel !== 'admin') {
      return createCorsResponse({ 
        error: 'Admin access required',
        debug: `Current access level: ${accessResult.accessLevel}, admin required`
      }, 403);
    }

    console.log('Admin access verified for company:', companyId, 'experience:', experienceId, 'user:', userId);

    // Step 5: Company-based data query (using companyId for tenant lookup)
    const tenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: companyId }
    });
    
    if (!tenant) {
      return createCorsResponse({ 
        error: 'Tenant not found for company',
        debug: `No tenant found for companyId: ${companyId}`
      }, 404);
    }

    const challenges = await prisma.challenge.findMany({
      where: {
        tenantId: tenant.id  // 🔧 FIX: Use company-based tenant, not experienceId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            winners: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return createCorsResponse({
      challenges,
      experienceContext: {
        experienceId,
        userId,
        accessLevel: accessResult.accessLevel
      }
    });

  } catch (error) {
    console.error('Admin challenges API error:', error);
    
    return createCorsResponse({ 
      error: 'Authentication required - please login via Whop',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, 401);
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCorsPreflightOptions();
}
