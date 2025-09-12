import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { autoCreateOrUpdateUser } from '@/lib/auto-company-extraction';
import { challengeAdminSchema } from '@/lib/adminSchema';
import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk';

// Generate simple ID - we'll use the built-in cuid() from Prisma
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// GET /api/challenges - Fetch all challenges (EXPERIENCE-SCOPED)
export async function GET(request: NextRequest) {
  try {
    // WHOP BEST PRACTICE: Always use experienceId for scoping
    const headersList = await headers();
    const experienceId = headersList.get('x-experience-id') || 
                        headersList.get('experience-id') ||
                        headersList.get('x-whop-experience-id');
    
    if (!experienceId) {
      return NextResponse.json({ 
        error: 'Experience context required',
        debug: 'No experienceId found in headers'
      }, { status: 400 });
    }

    // Get experience-scoped tenant
    let tenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: experienceId }
    });

    if (!tenant) {
      // Create tenant for this experience if it doesn't exist
      tenant = await prisma.tenant.create({
        data: {
          name: `Experience ${experienceId}`,
          whopCompanyId: experienceId
        }
      });
    }

    // Fetch challenges only from this experience (PERFECT ISOLATION)
    const challenges = await prisma.challenge.findMany({
      where: {
        tenantId: tenant.id,
        experienceId: experienceId  // 🔒 EXPERIENCE-SCOPED QUERIES
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

    return NextResponse.json({ challenges, experienceId });

  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// POST /api/challenges - Create new challenge (EXPERIENCE-SCOPED)
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Challenge creation API called');
    
    // WHOP BEST PRACTICE: Extract userId and experienceId
    const headersList = await headers();
    
    let userId: string | null = null;
    try {
      const tokenResult = await whopSdk.verifyUserToken(headersList);
      userId = tokenResult.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const experienceId = headersList.get('x-experience-id') || 
                        headersList.get('experience-id') ||
                        headersList.get('x-whop-experience-id');
    
    const headerCompanyId = headersList.get('x-whop-company-id');
    
    if (!experienceId) {
      return NextResponse.json({ 
        error: 'Experience context required',
        debug: 'No experienceId found in headers'
      }, { status: 400 });
    }

    // WHOP AUTH FLOW: Check admin access
    try {
      const experienceAccessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
        userId,
        experienceId
      });
      
      if (!experienceAccessResult.hasAccess || experienceAccessResult.accessLevel !== 'admin') {
        return NextResponse.json({ 
          error: 'Admin access required',
          debug: `User ${userId} has accessLevel '${experienceAccessResult.accessLevel}' but needs 'admin'`
        }, { status: 403 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Experience access verification failed'
      }, { status: 403 });
    }

    console.log('✅ Admin access verified for user:', userId, 'experience:', experienceId);

    // Parse request body
    const body = await request.json();
    console.log('📝 Request body received:', body);

    // Validate with schema
    const validationResult = challengeAdminSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error);
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const challengeData = validationResult.data;
    console.log('✅ Validation successful:', challengeData);

    // Get or create experience-scoped tenant
    const tenant = await prisma.tenant.upsert({
      where: { whopCompanyId: experienceId },
      create: {
        name: `Experience ${experienceId}`,
        whopCompanyId: experienceId
      },
      update: {
        // Update timestamp for activity tracking
        name: `Experience ${experienceId}`
      }
    });

    console.log('🏢 Experience tenant ready:', experienceId);

    // 🎯 Use NEW clean auto-creation system - NO FALLBACKS!
    const user = await autoCreateOrUpdateUser(userId, experienceId, headerCompanyId);

    // Create EXPERIENCE-SCOPED challenge
    const newChallenge = await prisma.challenge.create({
      data: {
        tenantId: tenant.id,
        experienceId: experienceId, // 🎯 EXPERIENCE SCOPING!
        whopCompanyId: experienceId, // Store experience as company for consistency
        title: challengeData.title,
        description: challengeData.description,
        startAt: challengeData.startAt,
        endAt: challengeData.endAt,
        proofType: challengeData.proofType,
        cadence: challengeData.cadence,
        imageUrl: challengeData.imageUrl,
        creatorId: user.id,
        // Store as JSON fields that exist in schema
        rules: {
          maxParticipants: challengeData.maxParticipants,
          difficulty: challengeData.difficulty || 'BEGINNER',
          policy: challengeData.policy,
          rewards: challengeData.rewards || []
        },
        // Optional marketing fields as JSON
        marketingTags: challengeData.tags || [],
        targetAudience: challengeData.targetAudience ? { description: challengeData.targetAudience } : {},
        whopCategoryName: challengeData.category,
        monetizationRules: challengeData.monetization || { enabled: false }
      },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    console.log('✅ Experience-scoped challenge created:', newChallenge.id, 'for experience:', experienceId);

    return NextResponse.json({ 
      message: 'Challenge created successfully',
      id: newChallenge.id,
      challenge: newChallenge
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Challenge creation error:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Challenge with this title already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to create challenge',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
