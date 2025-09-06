import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { challengeId } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        tenant: true,
        creator: true,
        enrollments: {
          include: {
            user: true,
          },
        },
        winners: true,
        challengeOffers: true,
        _count: {
          select: {
            enrollments: true,
            winners: true,
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Count actual check-ins (proof submissions)
    const checkinCount = await prisma.proof.count({
      where: {
        enrollment: {
          challengeId: challengeId,
        },
      },
    });

    // Get leaderboard data with check-ins per user
    const leaderboard = await prisma.enrollment.findMany({
      where: {
        challengeId: challengeId,
      },
      include: {
        user: true,
        proofs: true,
      },
      orderBy: {
        proofs: {
          _count: 'desc',
        },
      },
      take: 10, // Top 10 participants
    });

    // Transform leaderboard data
    const transformedLeaderboard = leaderboard.map(enrollment => ({
      id: enrollment.user.id,
      username: enrollment.user.name || 'Unknown User',
      email: enrollment.user.email,
      checkIns: enrollment.proofs.length,
      joinedAt: enrollment.joinedAt.toISOString(),
    }));

    // Calculate total streaks (sum of all user streaks)
    let totalStreaks = 0;
    leaderboard.forEach(enrollment => {
      const streak = calculateStreak(enrollment.proofs);
      totalStreaks += streak;
    });

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

    // Transform the data for the frontend
    const transformedChallenge = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      startAt: challenge.startAt.toISOString(),
      endAt: challenge.endAt.toISOString(),
      proofType: challenge.proofType,
      cadence: challenge.cadence,
      imageUrl: challenge.imageUrl,
      status: new Date() < challenge.startAt ? 'UPCOMING' : 
              new Date() > challenge.endAt ? 'ENDED' : 'ACTIVE',
      participants: challenge._count.enrollments,
      checkIns: checkinCount,
      totalStreaks: totalStreaks,
      leaderboard: transformedLeaderboard,
      // Handle different data structures in rules field
      rewards: (() => {
        if (!challenge.rules) return [];
        if (Array.isArray(challenge.rules)) return challenge.rules;
        if (typeof challenge.rules === 'object' && challenge.rules !== null && 'rewards' in challenge.rules) {
          const rulesObj = challenge.rules as { rewards?: any[] };
          return Array.isArray(rulesObj.rewards) ? rulesObj.rewards : [];
        }
        return [];
      })(),
      rules: (() => {
        if (!challenge.rules) return "";
        if (typeof challenge.rules === 'string') return challenge.rules;
        if (typeof challenge.rules === 'object' && challenge.rules !== null && 'policy' in challenge.rules) {
          const rulesObj = challenge.rules as { policy?: string };
          return rulesObj.policy || "";
        }
        return "";
      })(),
      creator: challenge.creator ? {
        id: challenge.creator.id,
        name: challenge.creator.name,
        email: challenge.creator.email,
      } : null,
      tenant: {
        id: challenge.tenant.id,
        name: challenge.tenant.name,
      },
    };

    return NextResponse.json(transformedChallenge);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { challengeId } = await params;
    const data = await request.json();

    // Enhanced handling: Always save in object format to maintain both policy and rewards
    let rulesData: any = null;
    const hasRewards = data.rewards && data.rewards.length > 0 && data.rewards.some((r: any) => r.title?.trim());
    const hasPolicy = data.policy && data.policy.trim();
    
    if (hasRewards || hasPolicy) {
      // Always use object format to preserve both policy and rewards
      rulesData = {
        policy: hasPolicy ? data.policy.trim() : "",
        rewards: hasRewards ? data.rewards.filter((r: any) => r.title?.trim()) : [],
        difficulty: "BEGINNER" // Add default difficulty
      };
    }

    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        title: data.title,
        description: data.description,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        proofType: data.proofType,
        cadence: data.cadence,
        imageUrl: data.imageUrl,
        rules: rulesData,
      },
      include: {
        creator: true,
        enrollments: {
          include: {
            user: true,
          },
        },
        winners: true,
        challengeOffers: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      challenge: updatedChallenge 
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { challengeId } = await params;

    await prisma.challenge.delete({
      where: { id: challengeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
