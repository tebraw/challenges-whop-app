import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = await params;

    // Get challenge details
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        enrollments: {
          where: { userId: user.id },
          include: {
            proofs: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const userEnrollment = challenge.enrollments[0];
    const isParticipating = !!userEnrollment;

    let userStats = null;
    if (isParticipating && userEnrollment) {
      const allProofs = userEnrollment.proofs;
      
      // Calculate max possible check-ins based on cadence
      const maxCheckIns = calculateMaxCheckIns(challenge);
      const completedCheckIns = allProofs.length;
      const completionRate = maxCheckIns > 0 ? (completedCheckIns / maxCheckIns) * 100 : 0;
      
      // Check if can check in based on cadence
      const canCheckIn = calculateCanCheckIn(challenge, allProofs);

      userStats = {
        completedCheckIns,
        maxCheckIns,
        completionRate: Math.round(completionRate), // Round to whole number
        canCheckInToday: canCheckIn,
        hasCheckedInToday: checkIfCheckedInToday(challenge, allProofs),
        joinedAt: userEnrollment.joinedAt,
        lastCheckin: allProofs[0]?.createdAt || null
      };
    }

    // Calculate challenge progress
    const now = new Date();
    const startDate = new Date(challenge.startAt);
    const endDate = new Date(challenge.endAt);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    let status = 'upcoming';
    if (now >= startDate && now <= endDate) {
      status = 'active';
    } else if (now > endDate) {
      status = 'ended';
    }

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        startAt: challenge.startAt,
        endAt: challenge.endAt,
        proofType: challenge.proofType,
        cadence: challenge.cadence,
        imageUrl: challenge.imageUrl,
        rules: challenge.rules,
        participantCount: challenge._count.enrollments,
        status,
        progress: {
          totalDays,
          daysElapsed,
          daysRemaining
        }
      },
      userParticipation: {
        isParticipating,
        stats: userStats
      }
    });

  } catch (error) {
    console.error('Error fetching challenge status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge status' },
      { status: 500 }
    );
  }
}

// Helper functions for new check-in logic
function calculateMaxCheckIns(challenge: any): number {
  if (challenge.cadence === 'END_OF_CHALLENGE') {
    return 1;
  }
  
  // For DAILY cadence, calculate days between start and end
  const startDate = new Date(challenge.startAt);
  const endDate = new Date(challenge.endAt);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function calculateCanCheckIn(challenge: any, proofs: any[]): boolean {
  const now = new Date();
  const challengeEnded = now > new Date(challenge.endAt);
  
  if (challengeEnded) return false;
  
  if (challenge.cadence === 'END_OF_CHALLENGE') {
    // Can check in any time during challenge if not done yet
    return proofs.length === 0;
  }
  
  // For DAILY cadence, check if already checked in today
  return !checkIfCheckedInToday(challenge, proofs);
}

function checkIfCheckedInToday(challenge: any, proofs: any[]): boolean {
  if (challenge.cadence === 'END_OF_CHALLENGE') {
    // For end of challenge, "today" means any proof exists
    return proofs.length > 0;
  }
  
  // For DAILY cadence, check if proof exists today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return proofs.some(proof => {
    const proofDate = new Date(proof.createdAt);
    proofDate.setHours(0, 0, 0, 0);
    return proofDate.getTime() === today.getTime();
  });
}
