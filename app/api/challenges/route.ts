import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { challengeAdminSchema } from '@/lib/adminSchema';

// Generate simple ID - we'll use the built-in cuid() from Prisma
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// GET /api/challenges - Fetch all challenges
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Development mode - return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockChallenges = [
        {
          id: 'cmf7lrtlq000314ehs17u67jy',
          title: '30-Day Fitness Challenge',
          description: 'Transform your fitness in 30 days',
          imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop',
          category: 'Fitness',
          startAt: new Date('2025-09-01'),
          endAt: new Date('2025-09-30'),
          isActive: true,
          proofType: 'PHOTO',
          difficulty: 'BEGINNER',
          cadence: 'DAILY',
          maxParticipants: 100,
          policy: 'Challenge terms and conditions...',
          rewards: [
            { place: 1, title: 'Winner Prize', desc: 'Amazing reward for first place' }
          ],
          _count: { 
            enrollments: 42 
          }
        },
        {
          id: 'cmf7lrtlq000414ehs17u67jz',
          title: 'Meditation Marathon',
          description: '21 days of daily meditation practice',
          imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=300&fit=crop',
          category: 'Wellness',
          startAt: new Date('2025-09-10'),
          endAt: new Date('2025-09-30'),
          isActive: true,
          proofType: 'TEXT',
          difficulty: 'INTERMEDIATE',
          cadence: 'DAILY',
          maxParticipants: 50,
          policy: 'Meditation challenge guidelines...',
          rewards: [
            { place: 1, title: 'Mindfulness Kit', desc: 'Complete meditation starter kit' }
          ],
          _count: { 
            enrollments: 28 
          }
        }
      ];

      return NextResponse.json({ challenges: mockChallenges });
    }

    // Production mode - fetch from database
    const challenges = await prisma.challenge.findMany({
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

    return NextResponse.json({ challenges });

  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// POST /api/challenges - Create new challenge
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Challenge creation API called');
    
    // Check authentication first
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('❌ No user found - authentication required');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('👤 Current user:', { id: user.id, email: user.email, role: user.role });

    // Require admin access
    try {
      await requireAdmin();
      console.log('✅ Admin access verified for user:', user.id);
    } catch (adminError) {
      console.log('❌ Admin access denied for user:', user.id, 'Error:', adminError);
      return NextResponse.json({ 
        error: 'Admin access required',
        details: adminError instanceof Error ? adminError.message : 'Access denied'
      }, { status: 403 });
    }

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

    // Ensure default tenant exists
    const defaultTenantId = 'default_tenant';
    const tenant = await prisma.tenant.upsert({
      where: { id: defaultTenantId },
      create: {
        id: defaultTenantId,
        name: 'Default Tenant',
        whopCompanyId: user.whopCompanyId
      },
      update: {}
    });

    // Ensure user is associated with the tenant
    await prisma.user.update({
      where: { id: user.id },
      data: { tenantId: tenant.id }
    });

    // Create challenge in database
    const newChallenge = await prisma.challenge.create({
      data: {
        experienceId: 'admin_created', // Default experienceId for admin-created challenges
        tenantId: tenant.id,
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

    console.log('✅ Challenge created successfully:', newChallenge.id);

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
