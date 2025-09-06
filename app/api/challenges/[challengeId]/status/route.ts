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
            checkins: {
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
      const allCheckins = userEnrollment.checkins;
      const currentStreak = calculateStreak(allCheckins);
      const totalCheckIns = allCheckins.length;
      
      // Check if can check in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCheckin = allCheckins.find(checkin => {
        const checkinDate = new Date(checkin.createdAt);
        checkinDate.setHours(0, 0, 0, 0);
        return checkinDate.getTime() === today.getTime();
      });

      const canCheckInToday = !todayCheckin && new Date() <= new Date(challenge.endAt);

      userStats = {
        currentStreak,
        totalCheckIns,
        canCheckInToday,
        hasCheckedInToday: !!todayCheckin,
        joinedAt: userEnrollment.joinedAt,
        lastCheckin: allCheckins[0]?.createdAt || null
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
