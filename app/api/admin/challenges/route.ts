import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

// Helper function to calculate current streak
function calculateStreak(checkins: any[]): number {
  if (checkins.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Sort checkins by date (most recent first)
  const sortedCheckins = checkins.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Check consecutive days backwards from today
  for (let i = 0; i < sortedCheckins.length; i++) {
    const checkinDate = new Date(sortedCheckins[i].createdAt);
    checkinDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - streak);
    
    if (checkinDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// GET /api/admin/challenges - Admin view of challenges
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
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
      challenges.map(async (challenge) => {
        // Count total check-ins for this challenge
        const totalCheckIns = await prisma.proof.count({
          where: {
            enrollment: {
              challengeId: challenge.id
            }
          }
        });

        // Get all enrollments with their proofs to calculate streaks
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

        // Calculate total streaks (sum of all user streaks)
        let totalStreaks = 0;
        enrollments.forEach(enrollment => {
          const streak = calculateStreak(enrollment.proofs);
          totalStreaks += streak;
        });

        return {
          ...challenge,
          participants: challenge._count.enrollments,
          checkIns: totalCheckIns,
          streakCount: totalStreaks
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
