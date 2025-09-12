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

// POST /api/challenges - Create new challenge (EXPERIENCE-SCOPED OR COMPANY OWNER)
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Challenge creation API called');
    
    // DEV MODE: Allow challenge creation for localhost testing
    if (process.env.NODE_ENV === 'development') {
      const headersList = await headers();
      const host = headersList.get('host');
      
      if (host && host.includes('localhost')) {
        console.log('🔧 DEV MODE: Processing challenge creation for localhost');
        
        const body = await request.json();
        
        try {
          // Ensure dev tenant exists
          const devTenant = await prisma.tenant.upsert({
            where: { whopCompanyId: 'dev-company-id' },
            create: {
              name: 'Dev Tenant',
              whopCompanyId: 'dev-company-id'
            },
            update: {}
          });
          
          // Create challenge with dev tenant ID
          const newChallenge = await prisma.challenge.create({
            data: {
              experienceId: 'dev-mode',
              title: body.title,
              description: body.description,
              proofType: body.proofType,
              rules: body.rules,
              startAt: new Date(body.startAt),
              endAt: new Date(body.endAt),
              imageUrl: body.imageUrl,
              tenantId: devTenant.id
            }
          });
          
          return NextResponse.json({
            message: 'Challenge created successfully (dev mode)',
            challenge: newChallenge
          });
        } catch (error) {
          console.error('DEV MODE challenge creation error:', error);
          return NextResponse.json({ 
            error: 'Failed to create challenge (dev mode)',
            debug: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }
    }
    
    // WHOP BEST PRACTICE: Extract userId and context
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
    
    // 🎯 CRITICAL: Support both Experience Members AND Company Owners
    const isCompanyOwner = !experienceId && headerCompanyId;
    const isExperienceMember = experienceId && !headerCompanyId;
    
    console.log('🔍 Challenge creation context:', {
      userId,
      experienceId,
      headerCompanyId,
      isCompanyOwner,
      isExperienceMember
    });
    
    if (!experienceId && !headerCompanyId) {
      return NextResponse.json({ 
        error: 'Context required',
        debug: 'Neither experienceId nor companyId found - please access via Whop app'
      }, { status: 400 });
    }

    // WHOP AUTH FLOW: Check admin access (different for Company Owner vs Experience Member)
    let hasAdminAccess = false;
    
    if (isCompanyOwner) {
      // Company Owner gets automatic admin access
      hasAdminAccess = true;
      console.log('✅ Company Owner admin access granted');
    } else {
      // Experience Member needs to be checked
      try {
        const experienceAccessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
          userId,
          experienceId: experienceId!
        });
        
        hasAdminAccess = experienceAccessResult.hasAccess && experienceAccessResult.accessLevel === 'admin';
        
        if (!hasAdminAccess) {
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
    }

    console.log('✅ Admin access verified for user:', userId, 'context:', experienceId || headerCompanyId);

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

    // Get or create tenant (experience-scoped OR company-scoped)
    const tenantId = experienceId || headerCompanyId!;
    const tenant = await prisma.tenant.upsert({
      where: { whopCompanyId: tenantId },
      create: {
        name: isCompanyOwner ? `Company ${headerCompanyId}` : `Experience ${experienceId}`,
        whopCompanyId: tenantId
      },
      update: {
        // Update timestamp for activity tracking
        name: isCompanyOwner ? `Company ${headerCompanyId}` : `Experience ${experienceId}`
      }
    });

    console.log('🏢 Tenant ready:', tenantId, '(Company Owner mode:', isCompanyOwner, ')');

    // 🎯 Use NEW clean auto-creation system - NO FALLBACKS!
    const user = await autoCreateOrUpdateUser(userId, experienceId || null, headerCompanyId || null);

    // Create challenge (EXPERIENCE-SCOPED OR COMPANY-SCOPED)
    const newChallenge = await prisma.challenge.create({
      data: {
        experienceId: experienceId || 'admin_created', // Default experienceId for admin-created challenges
        tenantId: tenant.id,
        whopCompanyId: tenantId, // Experience ID or Company ID
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

    console.log('✅ Challenge created:', newChallenge.id, 'for context:', tenantId, '(Company Owner mode:', isCompanyOwner, ')');

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
