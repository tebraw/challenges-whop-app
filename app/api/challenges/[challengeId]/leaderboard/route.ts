import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;

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
      const currentStreak = calculateStreak(checkins);
      const totalCheckIns = checkins.length;
      const lastCheckin = checkins[0]?.createdAt || null;

      return {
        userId: enrollment.user.id,
        username: enrollment.user.name || 'Anonymous',
        email: enrollment.user.email,
        joinedAt: enrollment.joinedAt,
        currentStreak,
        totalCheckIns,
        lastCheckin,
        // Calculate points (streak * 10 + total check-ins * 5)
        points: currentStreak * 10 + totalCheckIns * 5
      };
    });

    // Sort by points (highest first), then by current streak, then by total check-ins
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
      return b.totalCheckIns - a.totalCheckIns;
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
        totalCheckIns: leaderboard.reduce((sum, p) => sum + p.totalCheckIns, 0),
        averageStreak: leaderboard.length > 0 
          ? leaderboard.reduce((sum, p) => sum + p.currentStreak, 0) / leaderboard.length 
          : 0,
        topStreak: Math.max(...leaderboard.map(p => p.currentStreak), 0)
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

// Helper function to calculate current streak
function calculateStreak(checkins: any[]): number {
  if (checkins.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  for (let i = 0; i < checkins.length; i++) {
    const checkinDate = new Date(checkins[i].createdAt);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);
    
    const checkinDay = new Date(checkinDate);
    checkinDay.setHours(0, 0, 0, 0);
    
    if (checkinDay.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
