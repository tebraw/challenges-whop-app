import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
const prisma = new PrismaClient();

export async function GET(
  _: Request,
  context: { params: Promise<{ userId: string; challengeId: string }> }
) {
  try {
    // Require admin access
    await requireAdmin();
    
    const { userId, challengeId } = await context.params;

    console.log("Admin API Debug - Looking for user:", userId, "in challenge:", challengeId);

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    console.log("Admin API Debug - User found:", !!user, user?.email);

    if (!user) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    // Get enrollment for this user and challenge
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId,
        },
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            description: true,
            startAt: true,
            endAt: true,
            proofType: true,
          },
        },
        checkins: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            text: true,
            imageUrl: true,
            linkUrl: true,
          },
        },
        proofs: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            url: true,
            text: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    console.log("Admin API Debug - Enrollment found:", !!enrollment);
    console.log("Admin API Debug - Check-ins count:", enrollment?.checkins?.length || 0);
    console.log("Admin API Debug - Proofs count:", enrollment?.proofs?.length || 0);

    if (!enrollment) {
      return NextResponse.json({ ok: false, message: "User not enrolled in this challenge" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user,
      challenge: enrollment.challenge,
      enrollment: {
        id: enrollment.id,
        joinedAt: enrollment.joinedAt,
        checkins: enrollment.checkins,
        proofs: enrollment.proofs,
      },
    });
  } catch (e: any) {
    console.error("admin user challenge data", e);
    return NextResponse.json({ ok: false, message: e?.message || "Fehler" }, { status: 500 });
  }
}
