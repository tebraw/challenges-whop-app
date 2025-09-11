import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string; challengeId: string }> }
) {
  try {
    console.log("=== API Route Called ===");
    console.log("Request URL:", request.url);
    console.log("Request method:", request.method);
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Require admin access
    console.log("Checking admin access...");
    await requireAdmin();
    console.log("Admin access granted");
    
    const currentUser = await getCurrentUser();
    console.log("Current user:", currentUser?.id, currentUser?.email, currentUser?.role);

    if (!currentUser || !currentUser.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { userId, challengeId } = await context.params;

    console.log("Admin API Debug - Looking for user:", userId, "in challenge:", challengeId);

    // 🔒 TENANT ISOLATION: First verify challenge belongs to admin's tenant
    const challengeCheck = await prisma.challenge.findUnique({
      where: { 
        id: challengeId,
        tenantId: currentUser.tenantId  // 🔒 SECURITY: Only allow access to same tenant
      },
      select: { id: true }
    });

    if (!challengeCheck) {
      return NextResponse.json({ 
        ok: false, 
        message: "Challenge not found or access denied" 
      }, { status: 404 });
    }

    // Get user info (also should be from same tenant)
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        tenantId: currentUser.tenantId  // 🔒 SECURITY: Only allow access to same tenant users
      },
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

    // 🔒 TENANT ISOLATION: Get enrollment for this user and challenge (also checking tenant isolation)
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        challengeId: challengeId,
        userId: userId,
        challenge: {
          tenantId: currentUser.tenantId  // 🔒 SECURITY: Double-check challenge tenant
        }
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
    
    // Debug: Log actual data
    if (enrollment) {
      console.log("Admin API Debug - Checkins data:", enrollment.checkins);
      console.log("Admin API Debug - Proofs data:", enrollment.proofs);
    }

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
      // Debug information
      debug: {
        hasCheckins: (enrollment.checkins?.length || 0) > 0,
        hasProofs: (enrollment.proofs?.length || 0) > 0,
        checkinCount: enrollment.checkins?.length || 0,
        proofsCount: enrollment.proofs?.length || 0,
        enrollmentId: enrollment.id,
        challengeId: enrollment.challenge.id
      }
    });
  } catch (e: any) {
    console.error("=== API ERROR ===");
    console.error("Error type:", e.constructor.name);
    console.error("Error message:", e?.message);
    console.error("Error stack:", e?.stack);
    console.error("admin user challenge data", e);
    
    // Check if it's an auth error
    if (e?.message?.includes('Authentication') || e?.message?.includes('Admin') || e?.message?.includes('Unauthorized')) {
      return NextResponse.json({ 
        ok: false, 
        message: `Auth Error: ${e?.message}`,
        debug: {
          errorType: e.constructor.name,
          isAuthError: true,
          url: 'admin/users/[userId]/challenges/[challengeId]'
        }
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      ok: false, 
      message: e?.message || "Internal Server Error",
      debug: {
        errorType: e.constructor.name,
        url: 'admin/users/[userId]/challenges/[challengeId]'
      }
    }, { status: 500 });
  }
}
