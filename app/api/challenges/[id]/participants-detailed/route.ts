import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateChallengeProgress } from '@/lib/challengeRules';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // First get the challenge for progress calculation
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: { 
        id: true, 
        cadence: true, 
        startAt: true, 
        endAt: true 
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { challengeId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        checkins: {
          orderBy: { createdAt: 'desc' }
        },
        proofs: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    // Transform enrollments to match the Winner component's expected format
    const participants = enrollments.map(enrollment => {
      // Calculate progress using the same logic as the rest of the app
      const progress = calculateChallengeProgress(
        challenge, 
        enrollment.checkins, 
        enrollment.proofs
      );

      // Calculate streaks
      const streaks = calculateStreaks(enrollment.checkins, challenge);

      // Determine if challenge is completed
      const hasCompletedChallenge = progress.progressPercentage >= 100;

      // Transform submissions format
      const submissions = [
        ...enrollment.checkins.map(checkin => ({
          id: checkin.id,
          day: getDayNumber(checkin.createdAt.toISOString(), challenge.startAt.toISOString()),
          createdAt: checkin.createdAt.toISOString(),
          content: "Daily check-in completed",
          proofType: "TEXT" as const
        })),
        ...enrollment.proofs.map(proof => ({
          id: proof.id,
          day: getDayNumber(proof.createdAt.toISOString(), challenge.startAt.toISOString()),
          createdAt: proof.createdAt.toISOString(),
          content: proof.text || "",
          mediaUrl: proof.url || undefined,
          proofType: (proof.type as "TEXT" | "PHOTO" | "LINK") || "TEXT"
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        id: enrollment.id,
        userId: enrollment.userId,
        user: enrollment.user,
        completedDays: progress.completedDays,
        totalDays: progress.totalDays,
        completionRate: progress.progressPercentage,
        currentStreak: streaks.currentStreak,
        maxStreak: streaks.maxStreak,
        hasCompletedChallenge,
        submissions
      };
    });

    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Error fetching detailed participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to calculate streaks
function calculateStreaks(checkins: any[], challenge: any) {
  if (checkins.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  const startDate = new Date(challenge.startAt);
  const checkinDays = new Set();
  
  checkins.forEach(checkin => {
    const checkinDate = new Date(checkin.createdAt);
    const daysSinceStart = Math.floor((checkinDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceStart >= 0) {
      checkinDays.add(daysSinceStart);
    }
  });

  const sortedDays = Array.from(checkinDays).sort((a, b) => (a as number) - (b as number)) as number[];
  
  let maxStreak = 0;
  let currentStreakCount = 1;
  
  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] === (sortedDays[i - 1] as number) + 1) {
      currentStreakCount++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreakCount);
      currentStreakCount = 1;
    }
  }
  
  maxStreak = Math.max(maxStreak, currentStreakCount);

  // Calculate current streak (from the most recent day backwards)
  const today = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  let currentStreak = 0;
  
  for (let day = today; day >= 0; day--) {
    if (checkinDays.has(day)) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    currentStreak: sortedDays.length > 0 ? Math.max(1, currentStreak) : 0,
    maxStreak: sortedDays.length > 0 ? Math.max(1, maxStreak) : 0
  };
}

// Helper function to get day number from date
function getDayNumber(date: string, startAt: string): number {
  const startDate = new Date(startAt);
  const itemDate = new Date(date);
  return Math.floor((itemDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}
