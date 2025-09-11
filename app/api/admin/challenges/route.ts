import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySecureAdminAccess } from '@/lib/secure-admin-auth';

// 🎯 WHOP RULE #3: Auth nur auf dem Server - Minimal Flow
async function verifyAdminAccess() {
  const headersList = await headers();
  
  // Step 1: userId = verifyUserToken(headers)
  const { userId } = await whopSdk.verifyUserToken(headersList);
  if (!userId) {
    throw new Error('Authentication required');
  }

  // Get Experience context
  const experienceContext = await getExperienceContext();
  if (!experienceContext.experienceId) {
    // Fallback to company-based validation if no experienceId
    if (!experienceContext.companyId) {
      throw new Error('Experience or company context required');
    }
    
    // Use company-based access check as fallback
    const companyAccessResult = await whopSdk.access.checkIfUserHasAccessToCompany({
      userId,
      companyId: experienceContext.companyId
    });
    
    if (!companyAccessResult.hasAccess || companyAccessResult.accessLevel !== 'admin') {
      throw new Error('Admin access required');
    }
    
    return {
      userId,
      companyId: experienceContext.companyId,
      experienceId: null,
      accessLevel: companyAccessResult.accessLevel
    };
  }

  // Step 2: result = access.checkIfUserHasAccessToExperience
  const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
    userId,
    experienceId: experienceContext.experienceId
  });

  // Step 3: if (!result.hasAccess) -> 403
  if (!accessResult.hasAccess) {
    throw new Error('Access denied to experience');
  }

  // Step 4: if (admin-Action && result.accessLevel !== 'admin') -> 403
  if (accessResult.accessLevel !== 'admin') {
    throw new Error('Admin access required');
  }

  return {
    userId,
    companyId: experienceContext.companyId,
    experienceId: experienceContext.experienceId,
    accessLevel: accessResult.accessLevel
  };
}

// Type definition for challenge with relations
interface ChallengeWithRelations {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  proofType: string;
  cadence: string;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  startDate: Date;
  endDate: Date;
  policy: string | null;
  isPublic: boolean;
  rewards: any; // JSON field
  requireApproval: boolean;
  featured: boolean;
  creator: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  _count: {
    enrollments: number;
    winners: number;
  };
}

// 🎯 WHOP RULE #1 & #3: Experience-scoped admin view with proper auth
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin challenges API called');
    
    // CRITICAL: Strict admin verification with proper tenant isolation
    let adminUser;
    
    try {
      // Try Whop auth first
      const auth = await verifyAdminAccess();
      console.log('✅ Whop auth successful for user:', auth.userId);
      
      adminUser = await prisma.user.findUnique({
        where: { whopUserId: auth.userId },
        select: { id: true, tenantId: true, role: true, whopCompanyId: true }
      });
      
      if (!adminUser || adminUser.role !== 'ADMIN') {
        console.log('❌ User found but not admin:', adminUser);
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      
    } catch (authError) {
      console.log('⚠️ Whop auth failed:', authError);
      
      // 🚨 REMOVED DANGEROUS FALLBACK - NO MORE CROSS-TENANT ACCESS
      // Previously this allowed any admin to access any tenant's data!
      return NextResponse.json({ 
        error: 'Authentication required - please login via Whop',
        debug: 'Fallback admin access disabled for security'
      }, { status: 401 });
    }

    console.log('🔒 Admin user verified for tenant:', adminUser.tenantId);

    // 🎯 WHOP RULE #1: Experience ist dein Mandant - Scoped data access
    const challenges = await prisma.challenge.findMany({
      where: {
        tenantId: adminUser.tenantId  // 🔒 EXPERIENCE ISOLATION (using tenantId until migration)
        // TODO: Replace with experienceId: auth.experienceId when migration complete
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
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Enhanced with check-ins and streak data
    const enhancedChallenges = await Promise.all(
      challenges.map(async (challenge: any) => {
        // Count total check-ins for this challenge
        const totalCheckIns = await prisma.proof.count({
          where: {
            enrollment: {
              challengeId: challenge.id
            }
          }
        });

        // Get all enrollments with their proofs to calculate completion rates
        const enrollments = await prisma.enrollment.findMany({
          where: {
            challengeId: challenge.id
          },
          include: {
            proofs: {
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        });

        return {
          ...challenge,
          participants: challenge._count.enrollments,
          checkIns: totalCheckIns,
          streakCount: totalCheckIns // Use total check-ins instead of streak calculation
        };
      })
    );

    return NextResponse.json({ challenges: enhancedChallenges });
  } catch (error) {
    console.error('Error fetching admin challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// POST /api/admin/challenges - Same as main challenges endpoint for now
export async function POST(request: NextRequest) {
  // Redirect to main challenges endpoint
  const url = new URL('/api/challenges', request.url);
  return fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('Cookie') || ''
    },
    body: await request.text()
  });
}
