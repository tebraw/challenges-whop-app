import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
      try {
    await requireAdmin();
    
    const { challengeId } = await params;
    const { winners } = await request.json();

    if (!winners || !Array.isArray(winners)) {
      return NextResponse.json(
        { error: "Winners array is required" },
        { status: 400 }
      );
    }

    // Validate challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Delete existing winners for this challenge
    await prisma.challengeWinner.deleteMany({
      where: { challengeId },
    });

    // Create new winners
    const createdWinners = await Promise.all(
      winners.map(async (winner: any) => {
        // Validate participant exists
        const user = await prisma.user.findUnique({
          where: { id: winner.participantId },
        });

        if (!user) {
          throw new Error(`User not found: ${winner.participantId}`);
        }

        // Check if user is enrolled in this challenge
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            userId: winner.participantId,
            challengeId: challengeId,
          },
        });

        if (!enrollment) {
          throw new Error(`User ${winner.participantId} is not enrolled in this challenge`);
        }

        return prisma.challengeWinner.create({
          data: {
            challengeId: challengeId,
            userId: winner.participantId,
            place: winner.rank,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      })
    );

    return NextResponse.json({
      message: `Successfully saved ${createdWinners.length} winners`,
      winners: createdWinners,
    });

  } catch (error) {
    console.error('Error saving winners:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const winners = await prisma.challengeWinner.findMany({
      where: { challengeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        place: 'asc',
      },
    });

    return NextResponse.json({ winners });

  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
