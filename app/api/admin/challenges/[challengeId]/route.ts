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

    // Count check-ins from enrollments (we need to count from a separate table if it exists)
    const checkinCount = await prisma.enrollment.count({
      where: {
        challengeId: challengeId,
      },
    });

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
      checkins: checkinCount,
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

    // Smart handling of rules field: if rewards exist, save them; otherwise save policy
    let rulesData;
    if (data.rewards && data.rewards.length > 0 && data.rewards.some((r: any) => r.title?.trim())) {
      // Save rewards if they exist and are not empty
      rulesData = data.rewards;
    } else if (data.policy && data.policy.trim()) {
      // Save policy text if rewards are empty but policy exists
      rulesData = data.policy;
    } else {
      // Default to null if both are empty
      rulesData = null;
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
