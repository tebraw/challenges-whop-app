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
            proofs: {
              orderBy: {
                createdAt: 'asc'
              }
            }
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

    // Helper function to calculate max check-ins
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

    const maxCheckIns = calculateMaxCheckIns(challenge);

    // Generate leaderboard from the challenge enrollments (already includes proofs)
    const leaderboardData = challenge.enrollments.map(enrollment => {
      const completedCheckIns = enrollment.proofs.length;
      const completionRate = maxCheckIns > 0 ? completedCheckIns / maxCheckIns : 0;
      return {
        id: enrollment.user.id,
        username: enrollment.user.name || 'Unknown User',
        email: enrollment.user.email,
        checkIns: completedCheckIns,
        completionRate: completionRate,
        points: Math.round(completionRate * 100) + completedCheckIns * 5,
        joinedAt: enrollment.joinedAt.toISOString(),
      };
    });

    // Sort leaderboard by points (highest first)
    const transformedLeaderboard = leaderboardData
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
        return b.checkIns - a.checkIns;
      })
      .slice(0, 10); // Top 10 participants

    // Calculate average completion rate
    let avgCompletionRate = 0;
    challenge.enrollments.forEach(enrollment => {
      const completedCheckIns = enrollment.proofs.length;
      const completionRate = maxCheckIns > 0 ? completedCheckIns / maxCheckIns : 0;
      avgCompletionRate += completionRate;
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
      avgCompletionRate: challenge.enrollments.length > 0 ? avgCompletionRate / challenge.enrollments.length : 0,
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

    // Check if challenge exists and user has permission
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        tenant: true,
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Check if user has permission to delete this challenge
    // Only admin users or users from the same tenant can delete challenges
    const userTenant = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tenantId: true }
    });
    
    if (user.role !== 'ADMIN' && (!userTenant || challenge.tenantId !== userTenant.tenantId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete in correct order to respect foreign key constraints
    // 1. First delete all proofs
    await prisma.proof.deleteMany({
      where: {
        enrollment: {
          challengeId: challengeId
        }
      }
    });

    // 2. Delete all enrollments
    await prisma.enrollment.deleteMany({
      where: { challengeId: challengeId }
    });

    // 3. Delete winners
    await prisma.challengeWinner.deleteMany({
      where: { challengeId: challengeId }
    });

    // 4. Delete challenge offers
    await prisma.challengeOffer.deleteMany({
      where: { challengeId: challengeId }
    });

    // 4. Finally delete the challenge
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
