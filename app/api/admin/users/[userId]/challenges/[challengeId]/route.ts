import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string; challengeId: string }> }
) {
  try {
    console.log("=== User Proofs API Route Called ===");
    console.log("Request URL:", request.url);
    
    // Check for company owner access first (same fix as all-participants API)
    const headers = Object.fromEntries(request.headers.entries());
    const companyId = headers['x-whop-company-id'];
    console.log("🏢 Company ID from headers:", companyId);
    
    let targetTenantId = null;
    
    if (companyId) {
      console.log("✅ Company owner access detected");
      // Find tenant by company ID for company owners
      const tenant = await prisma.tenant.findFirst({
        where: { whopCompanyId: companyId }
      });
      targetTenantId = tenant?.id;
      console.log("🏢 Found tenant for company:", targetTenantId);
    } else {
      // Fallback to admin check
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
      targetTenantId = currentUser.tenantId;
    }

    if (!targetTenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    const { userId, challengeId } = await context.params;

    console.log("Admin API Debug - Looking for user:", userId, "in challenge:", challengeId);

    // 🔒 TENANT ISOLATION: First verify challenge belongs to admin's tenant
    const challengeCheck = await prisma.challenge.findUnique({
      where: { 
        id: challengeId,
        tenantId: targetTenantId  // 🔒 SECURITY: Only allow access to same tenant
      },
      select: { id: true }
    });

    if (!challengeCheck) {
      return NextResponse.json({ 
        ok: false, 
        message: "Challenge not found or access denied" 
      }, { status: 404 });
    }

    // Get user info (check both same tenant and cross-tenant with valid enrollment)
    let user = await prisma.user.findUnique({
      where: { 
        id: userId,
        tenantId: targetTenantId  // 🔒 SECURITY: Only allow access to same tenant users
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    console.log("Admin API Debug - User found in same tenant:", !!user, user?.email);

    // If user not found in same tenant, check if there's a valid enrollment (cross-tenant case)
    if (!user) {
      const crossTenantEnrollment = await prisma.enrollment.findFirst({
        where: {
          challengeId: challengeId,
          userId: userId,
          challenge: {
            tenantId: targetTenantId  // 🔒 SECURITY: Challenge must be in admin's tenant
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
              tenantId: true,
            }
          }
        }
      });

      if (crossTenantEnrollment) {
        user = {
          id: crossTenantEnrollment.user.id,
          email: crossTenantEnrollment.user.email,
          name: crossTenantEnrollment.user.name,
          createdAt: crossTenantEnrollment.user.createdAt,
        };
        console.log("Admin API Debug - Cross-tenant user found via enrollment:", user.email, "tenant:", crossTenantEnrollment.user.tenantId);
      }
    }

    if (!user) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    // 🔒 TENANT ISOLATION: Get enrollment for this user and challenge (also checking tenant isolation)
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        challengeId: challengeId,
        userId: userId,
        challenge: {
          tenantId: targetTenantId  // 🔒 SECURITY: Double-check challenge tenant
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
