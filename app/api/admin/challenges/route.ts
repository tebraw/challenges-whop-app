import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

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

// GET /api/admin/challenges - Admin view of challenges
export async function GET(request: NextRequest) {
  try {
    // TODO: Re-enable auth check when auth is working
    // await requireAdmin();
    
    console.log('🔍 Admin challenges API called');
    
    const challenges = await prisma.challenge.findMany({
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
