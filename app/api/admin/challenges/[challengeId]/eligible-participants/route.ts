import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

// Type definitions for better type safety
interface EnrollmentWithUserAndProofs {
  id: string;
  joinedAt: Date;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  proofs: Array<{
    id: string;
    type: string;
    text?: string | null;
    url?: string | null;
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
    await requireAdmin();
    
    const { challengeId } = await params;

    // Get challenge details
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
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

    // Process participants and filter eligible ones
    const eligibleParticipants = challenge.enrollments
      .map((enrollment: EnrollmentWithUserAndProofs) => {
        const completedCheckIns = enrollment.proofs.length;
        const completionRate = requiredCheckIns > 0 ? completedCheckIns / requiredCheckIns : 0;
        
        // Participant is eligible if they have completed all required check-ins
        // and all proofs match the required format
        const hasRequiredCheckIns = completedCheckIns >= requiredCheckIns;
        const hasCorrectProofFormat = enrollment.proofs.every((proof: any) => {
          // Check if proof format matches challenge requirement
          if (challenge.proofType === 'PHOTO') {
            return proof.url != null && proof.url.trim() !== '';
          } else if (challenge.proofType === 'TEXT') {
            return proof.text != null && proof.text.trim() !== '';
          } else if (challenge.proofType === 'LINK') {
            return proof.url != null && proof.url.trim() !== '';
          }
          return false;
        });

        const isEligible = hasRequiredCheckIns && hasCorrectProofFormat;

        return {
          id: enrollment.user.id,
          enrollmentId: enrollment.id,
          name: enrollment.user.name || enrollment.user.email?.split('@')[0] || 'Unknown',
          email: enrollment.user.email || '',
          avatar: enrollment.user.name ? enrollment.user.name.charAt(0).toUpperCase() : '?',
          completedCheckIns,
          requiredCheckIns,
          completionRate: Math.round(completionRate * 100),
          isEligible,
          hasRequiredCheckIns,
          hasCorrectProofFormat,
          points: Math.round(completionRate * 100) + completedCheckIns * 5,
          joinedAt: enrollment.joinedAt.toISOString(),
          proofs: enrollment.proofs.map((proof: any) => ({
            id: proof.id,
            type: proof.type,
            text: proof.text,
            url: proof.url,
            createdAt: proof.createdAt.toISOString(),
          })),
        };
      })
      .filter((participant: any) => participant.isEligible) // Only return eligible participants
      .sort((a: any, b: any) => {
        // Sort by points (highest first), then by completion rate, then by check-ins
        if (b.points !== a.points) return b.points - a.points;
        if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
        return b.completedCheckIns - a.completedCheckIns;
      });

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        title: challenge.title,
        cadence: challenge.cadence,
        proofType: challenge.proofType,
        requiredCheckIns,
      },
      eligibleParticipants,
      totalParticipants: challenge.enrollments.length,
      eligibleCount: eligibleParticipants.length,
    });

  } catch (error) {
    console.error('Error fetching eligible participants:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
