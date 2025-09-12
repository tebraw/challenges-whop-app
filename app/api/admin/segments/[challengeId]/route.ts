import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  context: { params: Promise<{ challengeId: string }> }
) {
      try {
    // SICHERHEIT: Nur Admins
    await requireAdmin();

    const { challengeId } = await context.params;
    
    // Get challenge with participant data
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        enrollments: {
          include: {
            checkins: {
              orderBy: { createdAt: 'desc' }
            },
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Calculate challenge duration for analysis
    const challengeDuration = Math.ceil(
      (new Date(challenge.endAt).getTime() - new Date(challenge.startAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Analyze participants and create segments
    const participants = challenge.enrollments.map(enrollment => {
      const checkinCount = enrollment.checkins.length;
      const completionRate = challengeDuration > 0 ? (checkinCount / challengeDuration) * 100 : 0;
      
      // Check recent activity (last 3 days)
      const recentCheckins = enrollment.checkins.filter(c => 
        new Date(c.createdAt).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000
      );
      const isRecentlyActive = recentCheckins.length > 0;
      
      // Calculate engagement level
      let engagementLevel: 'high' | 'medium' | 'low';
      if (completionRate >= 80 && isRecentlyActive) {
        engagementLevel = 'high';
      } else if (completionRate >= 50 || isRecentlyActive) {
        engagementLevel = 'medium';
      } else {
        engagementLevel = 'low';
      }
      
      // Calculate conversion potential
      let conversionPotential: 'high' | 'medium' | 'low';
      if (completionRate >= 70 && checkinCount >= 5) {
        conversionPotential = 'high';
      } else if (completionRate >= 40 || checkinCount >= 3) {
        conversionPotential = 'medium';
      } else {
        conversionPotential = 'low';
      }

      return {
        ...enrollment,
        checkinCount,
        completionRate,
        isRecentlyActive,
        engagementLevel,
        conversionPotential
      };
    });

    // Create segments
    const segments = [
      {
        id: "super_engaged",
        name: "Super Engaged",
        description: "Participants with 80%+ completion and recent activity",
        participants: participants.filter(p => p.completionRate >= 80 && p.isRecentlyActive),
        engagementLevel: "high" as const,
        conversionPotential: "high" as const,
        characteristics: [
          "80%+ completion rate",
          "Active within last 3 days", 
          "Consistent daily participation",
          "High likelihood to complete challenge"
        ],
        recommendedActions: [
          "Offer exclusive VIP products",
          "Invite to beta programs",
          "Create ambassador opportunities",
          "Send premium upgrade offers"
        ]
      },
      {
        id: "consistent_performers",
        name: "Consistent Performers",
        description: "Regular participants with steady engagement",
        participants: participants.filter(p => 
          p.completionRate >= 50 && p.completionRate < 80 && (p.isRecentlyActive || p.checkinCount >= 5)
        ),
        engagementLevel: "medium" as const,
        conversionPotential: "high" as const,
        characteristics: [
          "50-79% completion rate",
          "Regular check-in patterns",
          "Good consistency overall",
          "Responds well to motivation"
        ],
        recommendedActions: [
          "Gamify their experience",
          "Offer milestone rewards",
          "Create group challenges",
          "Send targeted product recommendations"
        ]
      },
      {
        id: "struggling_participants",
        name: "Struggling Participants",
        description: "Need motivation and support to stay engaged",
        participants: participants.filter(p => 
          p.completionRate >= 20 && p.completionRate < 50
        ),
        engagementLevel: "low" as const,
        conversionPotential: "medium" as const,
        characteristics: [
          "20-49% completion rate",
          "Irregular participation",
          "May need additional support",
          "Potential for improvement"
        ],
        recommendedActions: [
          "Send motivational messages",
          "Offer support resources",
          "Create easier entry points",
          "Provide coaching options"
        ]
      },
      {
        id: "at_risk",
        name: "At Risk",
        description: "Low engagement, likely to drop out",
        participants: participants.filter(p => p.completionRate < 20),
        engagementLevel: "low" as const,
        conversionPotential: "low" as const,
        characteristics: [
          "Less than 20% completion",
          "Minimal or no recent activity",
          "May have joined but not engaged",
          "Risk of dropping out"
        ],
        recommendedActions: [
          "Re-engagement campaign",
          "Simplified challenge options", 
          "Personal outreach",
          "Exit survey to understand barriers"
        ]
      }
    ];

    // Calculate percentages and format response
    const totalParticipants = participants.length;
    const segmentData = segments.map(segment => ({
      id: segment.id,
      name: segment.name,
      description: segment.description,
      count: segment.participants.length,
      percentage: totalParticipants > 0 ? Math.round((segment.participants.length / totalParticipants) * 100) : 0,
      engagementLevel: segment.engagementLevel,
      conversionPotential: segment.conversionPotential,
      characteristics: segment.characteristics,
      recommendedActions: segment.recommendedActions
    }));

    return NextResponse.json({ segments: segmentData });
  } catch (error) {
    console.error("Segments error:", error);
    return NextResponse.json(
      { error: "Failed to load segments" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
