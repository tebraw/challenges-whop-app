import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk';
import { headers } from 'next/headers';
import { createCorsResponse, handleCorsPreflightOptions } from '@/lib/cors';

// Helper: Get Experience Context
async function getExperienceContext() {
  const headersList = await headers();
  const experienceId = headersList.get('x-experience-id') || 
                      headersList.get('experience-id') ||
                      process.env.WHOP_EXPERIENCE_ID;
  return { experienceId };
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

    // Step 2: Get experience context
    const { experienceId } = await getExperienceContext();
    
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

    console.log('Admin access verified for experience:', experienceId, 'user:', userId);

    // Step 5: Experience-scoped data query
    const challenges = await prisma.challenge.findMany({
      where: {
        tenantId: experienceId
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
