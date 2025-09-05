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
    
    // Get challenge data for analysis
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        enrollments: {
          include: {
            checkins: true,
            user: true
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Analyze participant data to suggest product opportunities
    const totalParticipants = challenge.enrollments.length;
    const opportunities = [];

    // High engagement product opportunity
    const highEngagementUsers = challenge.enrollments.filter(e => e.checkins.length > 5);
    const engagementRate = totalParticipants > 0 ? (highEngagementUsers.length / totalParticipants) * 100 : 0;

    if (engagementRate > 15) {
      opportunities.push({
        id: "premium_coaching",
        title: "Premium Challenge Coaching",
        description: "1-on-1 coaching sessions for high-engagement participants",
        targetAudience: `${highEngagementUsers.length} high-engagement participants (${Math.round(engagementRate)}% of total)`,
        pricePoint: "$79-149/session",
        confidence: Math.min(95, Math.round(engagementRate * 3)),
        reasoning: [
          `${Math.round(engagementRate)}% of participants show premium engagement levels`,
          "High completion rates indicate commitment to results",
          "Personal guidance requests mentioned in feedback",
          "Premium coaching market shows strong conversion rates"
        ]
      });
    }

    // Achievement-based product
    const completionTracking = challenge.enrollments.map(e => {
      const challengeDays = Math.ceil(
        (new Date(challenge.endAt).getTime() - new Date(challenge.startAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const completionRate = challengeDays > 0 ? (e.checkins.length / challengeDays) * 100 : 0;
      return { ...e, completionRate };
    });

    const achievers = completionTracking.filter(e => e.completionRate > 70);
    const achievementRate = totalParticipants > 0 ? (achievers.length / totalParticipants) * 100 : 0;

    if (achievementRate > 20) {
      opportunities.push({
        id: "achievement_bundle",
        title: "Challenge Master Certificate + Merch Bundle",
        description: "Physical certificates, branded merchandise, and exclusive content for top performers",
        targetAudience: `${achievers.length} high-achievers (${Math.round(achievementRate)}% completion rate)`,
        pricePoint: "$39-69",
        confidence: Math.min(90, Math.round(achievementRate * 4)),
        reasoning: [
          `${Math.round(achievementRate)}% of participants are high achievers`,
          "Recognition and achievement motivation clearly evident",
          "Physical rewards increase perceived value",
          "Successful completion indicates willingness to invest"
        ]
      });
    }

    // Advanced content product
    const activeUsers = challenge.enrollments.filter(e => 
      e.checkins.some(c => new Date(c.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const activeRate = totalParticipants > 0 ? (activeUsers.length / totalParticipants) * 100 : 0;

    if (activeRate > 40) {
      opportunities.push({
        id: "advanced_content",
        title: "Advanced Challenge Masterclass",
        description: "Next-level content and strategies for challenge graduates",
        targetAudience: `${activeUsers.length} active participants ready for advanced content`,
        pricePoint: "$97-197",
        confidence: Math.min(85, Math.round(activeRate * 2)),
        reasoning: [
          `${Math.round(activeRate)}% maintain active engagement`,
          "Consistent participation indicates desire for growth",
          "Advanced learners seek next-level content",
          "Educational products have high perceived value"
        ]
      });
    }

    // Community/Group product
    if (totalParticipants > 50) {
      opportunities.push({
        id: "exclusive_community",
        title: "VIP Challenge Community",
        description: "Exclusive membership community with bonus challenges and peer support",
        targetAudience: `Challenge graduates seeking ongoing community support`,
        pricePoint: "$19-39/month",
        confidence: 75,
        reasoning: [
          `${totalParticipants} participants show community interest`,
          "Group challenges create natural community bonds",
          "Recurring revenue model with high retention potential",
          "Social proof and peer support drive continued engagement"
        ]
      });
    }

    // Consultation/Done-for-you service
    const strugglingUsers = challenge.enrollments.filter(e => e.checkins.length < 3);
    const struggleRate = totalParticipants > 0 ? (strugglingUsers.length / totalParticipants) * 100 : 0;

    if (struggleRate > 20) {
      opportunities.push({
        id: "done_for_you",
        title: "Done-For-You Challenge Solution",
        description: "Personalized challenge setup and daily support service",
        targetAudience: `${strugglingUsers.length} participants needing additional support`,
        pricePoint: "$197-497",
        confidence: Math.min(80, Math.round(40 + (struggleRate * 1.5))),
        reasoning: [
          `${Math.round(struggleRate)}% of participants struggle with consistency`,
          "High-value service addressing specific pain points",
          "Premium pricing justified by personalized delivery",
          "Done-for-you services show strong profit margins"
        ]
      });
    }

    return NextResponse.json({ opportunities });
  } catch (error) {
    console.error("Product opportunities error:", error);
    return NextResponse.json(
      { error: "Failed to load product opportunities" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
