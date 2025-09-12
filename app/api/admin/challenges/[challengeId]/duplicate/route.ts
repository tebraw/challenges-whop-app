// app/api/admin/challenges/[challengeId]/duplicate/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
      try {
    // Authenticate and check admin permission
    await requireAdmin();
    const user = await getCurrentUser();

    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { challengeId } = await params;

    // 🔒 TENANT ISOLATION: Find the original challenge only from same tenant
    const originalChallenge = await prisma.challenge.findUnique({
      where: { 
        id: challengeId,
        tenantId: user.tenantId  // 🔒 SECURITY: Only allow access to same tenant
      },
      include: {
        creator: true,
      },
    });

    if (!originalChallenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Current user is already loaded above - use it for creator ID
    if (!user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Create a copy with modified title and new dates
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const duplicatedChallenge = await prisma.challenge.create({
      data: {
        title: `${originalChallenge.title} (Copy)`,
        description: originalChallenge.description,
        startAt: oneWeekFromNow,
        endAt: twoWeeksFromNow,
        proofType: originalChallenge.proofType,
        cadence: originalChallenge.cadence,
        rules: originalChallenge.rules || undefined,
        imageUrl: originalChallenge.imageUrl,
        tenantId: originalChallenge.tenantId,
        creatorId: user.id,
        experienceId: originalChallenge.experienceId,
        whopCreatorId: originalChallenge.whopCreatorId,
        whopCategoryId: originalChallenge.whopCategoryId,
        whopCategoryName: originalChallenge.whopCategoryName,
        whopTags: originalChallenge.whopTags || undefined,
        monetizationRules: originalChallenge.monetizationRules || undefined,
        targetAudience: originalChallenge.targetAudience || undefined,
        marketingTags: originalChallenge.marketingTags || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      challengeId: duplicatedChallenge.id,
      message: `Challenge "${duplicatedChallenge.title}" created successfully`,
    });

  } catch (error) {
    console.error("Error duplicating challenge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
