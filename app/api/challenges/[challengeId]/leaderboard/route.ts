import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper functions from status API
function calculateMaxCheckIns(challenge: any): number {
  if (challenge.cadence === 'DAILY') {
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, daysDiff + 1);
  } else {
    return 1; // END_OF_CHALLENGE
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;

    // Get challenge data
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const maxCheckIns = calculateMaxCheckIns(challenge);

    // Get all enrollments with user data and check-ins
    const enrollments = await prisma.enrollment.findMany({
      where: { challengeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        checkins: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Calculate stats for each participant
    const leaderboard = enrollments.map(enrollment => {
      const checkins = enrollment.checkins;
      const completedCheckIns = checkins.length;
      const completionRate = maxCheckIns > 0 ? completedCheckIns / maxCheckIns : 0;
      const lastCheckin = checkins[0]?.createdAt || null;

      return {
        userId: enrollment.user.id,
        username: enrollment.user.name || 'Anonymous',
        email: enrollment.user.email,
        joinedAt: enrollment.joinedAt,
        completedCheckIns,
        maxCheckIns,
        completionRate,
        lastCheckin,
        // Calculate points based on completion rate and total check-ins
        points: Math.round(completionRate * 100) + completedCheckIns * 5
      };
    });

    // Sort by points (highest first), then by completion rate, then by total check-ins
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
      return b.completedCheckIns - a.completedCheckIns;
    });

    // Add ranking
    const rankedLeaderboard = leaderboard.map((participant, index) => ({
      ...participant,
      rank: index + 1
    }));

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      totalParticipants: enrollments.length,
      stats: {
        totalCheckIns: leaderboard.reduce((sum, p) => sum + p.completedCheckIns, 0),
        averageCompletionRate: leaderboard.length > 0 
          ? leaderboard.reduce((sum, p) => sum + p.completionRate, 0) / leaderboard.length 
          : 0,
        topCompletionRate: Math.max(...leaderboard.map(p => p.completionRate), 0)
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
