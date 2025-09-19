import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getBatchRealWhopUsernames } from "@/lib/whop-usernames";

// Type definitions for better type safety
interface EnrollmentWithUserAndProofs {
  id: string;
  joinedAt: Date;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    whopUserId?: string | null;
  };
  proofs: Array<{
    id: string;
    type: string;
    text?: string | null;
    url?: string | null;
    createdAt: Date;
  }>;
  checkins: Array<{
    id: string;
    createdAt: Date;
  }>;
}

interface ParticipantData {
  id: string;
  enrollmentId: string;
  name: string;
  email: string;
  avatar: string;
  completedCheckIns: number;
  requiredCheckIns: number;
  completionRate: number;
  isEligible: boolean;
  hasRequiredCheckIns: boolean;
  hasCorrectProofFormat: boolean;
  ineligibilityReason?: string;
  points: number;
  joinedAt: string;
  proofs: Array<{
    id: string;
    type: string;
    text?: string | null;
    url?: string | null;
    createdAt: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    console.log('🚀 All-Participants API called');
    
    // Get headers first for company owner detection
    const headers = Object.fromEntries(request.headers.entries());
    const companyId = headers['x-whop-company-id'];
    console.log('🏢 Company ID from headers:', companyId);
    
    // Check for company owner first (this works!)
    if (companyId) {
      console.log('✅ Company owner access detected, proceeding without getCurrentUser');
      // Company owners have access, skip user lookup
    } else {
      // Fallback to admin check
      const user = await getCurrentUser();
      console.log('👤 Current user:', user?.id, user?.whopUserId, user?.role);

      if (!user || !user.tenantId) {
        console.log('❌ No user or tenant found');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check admin role
      if (user.role !== 'ADMIN') {
        console.log('🚫 Access denied - not admin');
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    console.log('✅ Access granted - proceeding with API');

    const { challengeId } = await params;

    // 🔒 TENANT ISOLATION: For company owners, find tenant by company ID
    let targetTenantId = null;
    
    if (companyId) {
      // Find tenant by company ID for company owners
      const tenant = await prisma.tenant.findFirst({
        where: { whopCompanyId: companyId }
      });
      targetTenantId = tenant?.id;
      console.log('🏢 Found tenant for company:', targetTenantId);
    } else {
      // Use user's tenant for admin users
      const user = await getCurrentUser();
      targetTenantId = user?.tenantId;
      console.log('👤 Using user tenant:', targetTenantId);
    }

    if (!targetTenantId) {
      console.log('❌ No tenant found');
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // 🔒 TENANT ISOLATION: Get challenge details only from same tenant
    const challenge = await prisma.challenge.findUnique({
      where: { 
        id: challengeId,
        tenantId: targetTenantId  // 🔒 SECURITY: Only allow access to same tenant
      },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                whopUserId: true
              }
            },
            proofs: {
              orderBy: {
                createdAt: 'desc'
              }
            },
            checkins: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Calculate required check-ins based on cadence
    function calculateRequiredCheckIns(challenge: any): number {
      if (challenge.cadence === 'DAILY') {
        const startDate = new Date(challenge.startAt);
        const endDate = new Date(challenge.endAt);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, daysDiff + 1);
      } else {
        return 1; // END_OF_CHALLENGE
      }
    }

    const requiredCheckIns = calculateRequiredCheckIns(challenge);

    // 🎯 FETCH REAL USERNAMES: Get all whopUserIds and fetch real usernames from Whop
    const whopUserIds = challenge.enrollments
      .map(enrollment => enrollment.user.whopUserId)
      .filter(id => id) as string[];
    
    const realUsernames = await getBatchRealWhopUsernames(whopUserIds);
    console.log(`📋 Fetched ${realUsernames.size} real usernames from Whop API`);

    // Process all participants and determine eligibility
    const allParticipants: ParticipantData[] = challenge.enrollments.map((enrollment: EnrollmentWithUserAndProofs) => {
      // CLEAN LOGIC: Only count proofs for eligibility (quality control)
      // CheckIns are used separately for activity tracking (fire emojis)
      const completedCheckIns = enrollment.proofs.length;
      const completionRate = requiredCheckIns > 0 ? Math.round((completedCheckIns / requiredCheckIns) * 100) : 0;
      
      // Check if participant has required number of proofs
      const hasRequiredCheckIns = completedCheckIns >= requiredCheckIns;
      
      // Check if proofs match required format
      let hasCorrectProofFormat = true;
      let formatIssue = '';
      
      if (challenge.proofType === 'PHOTO') {
        const hasNonImageProof = enrollment.proofs.some(proof => proof.type !== 'PHOTO' || !proof.url);
        if (hasNonImageProof) {
          hasCorrectProofFormat = false;
          formatIssue = 'Contains non-photo proofs';
        }
      } else if (challenge.proofType === 'TEXT') {
        const hasNonTextProof = enrollment.proofs.some(proof => proof.type !== 'TEXT' || !proof.text);
        if (hasNonTextProof) {
          hasCorrectProofFormat = false;
          formatIssue = 'Contains non-text proofs';
        }
      } else if (challenge.proofType === 'LINK') {
        const hasNonLinkProof = enrollment.proofs.some(proof => proof.type !== 'LINK' || !proof.url);
        if (hasNonLinkProof) {
          hasCorrectProofFormat = false;
          formatIssue = 'Contains non-link proofs';
        }
      }
      
      // Determine overall eligibility and reason for ineligibility
      const isEligible = hasRequiredCheckIns && hasCorrectProofFormat;
      let ineligibilityReason = '';
      
      if (!isEligible) {
        if (!hasRequiredCheckIns && !hasCorrectProofFormat) {
          ineligibilityReason = `Insufficient proofs (${completedCheckIns}/${requiredCheckIns}) and ${formatIssue.toLowerCase()}`;
        } else if (!hasRequiredCheckIns) {
          ineligibilityReason = `Insufficient proofs (${completedCheckIns}/${requiredCheckIns})`;
        } else if (!hasCorrectProofFormat) {
          ineligibilityReason = formatIssue;
        }
      }

      return {
        id: enrollment.user.id,
        enrollmentId: enrollment.id,
        name: enrollment.user.whopUserId 
          ? realUsernames.get(enrollment.user.whopUserId) || enrollment.user.name || 'Unknown'
          : enrollment.user.name || enrollment.user.email?.split('@')[0] || 'Unknown',
        email: enrollment.user.email || '',
        avatar: '👤',
        completedCheckIns,
        requiredCheckIns,
        completionRate,
        isEligible,
        hasRequiredCheckIns,
        hasCorrectProofFormat,
        ineligibilityReason: ineligibilityReason || undefined,
        points: completedCheckIns * 10, // Simple point system
        joinedAt: enrollment.joinedAt.toISOString(),
        proofs: enrollment.proofs.map(proof => ({
          id: proof.id,
          type: proof.type,
          text: proof.text,
          url: proof.url,
          createdAt: proof.createdAt.toISOString(),
        }))
      };
    });

    // Sort participants: eligible first (by completion rate desc), then ineligible (by completion rate desc)
    allParticipants.sort((a, b) => {
      // First, sort by eligibility (eligible participants first)
      if (a.isEligible !== b.isEligible) {
        return b.isEligible ? 1 : -1;
      }
      
      // Then by completion rate (highest first)
      if (a.completionRate !== b.completionRate) {
        return b.completionRate - a.completionRate;
      }
      
      // Finally by join date (earliest first)
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

    // Separate eligible and all participants for convenience
    const eligibleParticipants = allParticipants.filter(p => p.isEligible);

    return NextResponse.json({
      success: true,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        cadence: challenge.cadence,
        proofType: challenge.proofType,
        requiredCheckIns,
        startDate: challenge.startAt.toISOString(),
        endDate: challenge.endAt.toISOString(),
      },
      allParticipants,
      eligibleParticipants,
      stats: {
        totalParticipants: allParticipants.length,
        eligibleCount: eligibleParticipants.length,
        ineligibleCount: allParticipants.length - eligibleParticipants.length,
        averageCompletionRate: allParticipants.length > 0 
          ? Math.round(allParticipants.reduce((sum, p) => sum + p.completionRate, 0) / allParticipants.length)
          : 0
      }
    });

  } catch (error) {
    console.error("Error fetching all participants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}