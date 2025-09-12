import { NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Type definitions for better type safety
interface CheckinData {
  id: string;
  createdAt: Date;
  text?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
}

interface EnrollmentData {
  id: string;
  userId: string;
  checkins: CheckinData[];
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

interface ChallengeData {
  id: string;
  title: string;
  enrollments: EnrollmentData[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
      try {
    // SICHERHEIT: Nur Admins
    await requireAdmin();
    const user = await getCurrentUser();

    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { challengeId } = await params;
    
    // 🔒 TENANT ISOLATION: Get challenge data for analysis only from same tenant
    const challenge = await prisma.challenge.findUnique({
      where: { 
        id: challengeId,
        tenantId: user.tenantId  // 🔒 SECURITY: Only allow access to same tenant
      },
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

    // Analyze participant behavior and generate marketing insights
    const totalParticipants = challenge.enrollments.length;
    const insights = [];

    // High engagement insight
    const highEngagementUsers = challenge.enrollments.filter((e: any) => e.checkins.length > 5).length;
    const highEngagementRate = totalParticipants > 0 ? (highEngagementUsers / totalParticipants) * 100 : 0;
    
    if (highEngagementRate > 20) {
      insights.push({
        id: "high_engagement_opportunity",
        type: "product_opportunity",
        title: "High Engagement = Product Opportunity",
        description: `${Math.round(highEngagementRate)}% of participants show high engagement - perfect for premium offerings`,
        impact: "high",
        effort: "low",
        estimatedRoi: "300-500%",
        actionItems: [
          "Create exclusive product for top performers",
          "Send targeted offers to high-engagement users",
          "Implement early access for new products",
          "Develop VIP membership tier"
        ]
      });
    }

    // Completion rate insight
    const challengeDays = Math.ceil(
      (new Date(challenge.endAt).getTime() - new Date(challenge.startAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const avgCheckins = totalParticipants > 0 ? 
      challenge.enrollments.reduce((sum: number, e: any) => sum + e.checkins.length, 0) / totalParticipants : 0;
    const completionRate = challengeDays > 0 ? (avgCheckins / challengeDays) * 100 : 0;
    
    if (completionRate > 70) {
      insights.push({
        id: "completion_momentum",
        type: "conversion_tip",
        title: "Challenge-to-Product Bridge Opportunity",
        description: `${Math.round(completionRate)}% completion rate indicates strong commitment - ideal for upselling`,
        impact: "high",
        effort: "medium",
        estimatedRoi: "400-600%",
        actionItems: [
          "Offer completion rewards with product discounts",
          "Create product bundles for finishers",
          "Implement milestone-based offers",
          "Launch graduate program with premium content"
        ]
      });
    }

    // Engagement timing insight
    const recentCheckins = challenge.enrollments.flatMap((e: any) => e.checkins)
      .filter((c: any) => new Date(c.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const hourlyActivity = new Array(24).fill(0);
    recentCheckins.forEach((checkin: any) => {
      const hour = new Date(checkin.createdAt).getHours();
      hourlyActivity[hour]++;
    });
    
    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
    
    insights.push({
      id: "optimal_timing",
      type: "engagement_boost",
      title: "Optimal Posting Time Detected",
      description: `Peak activity at ${peakHour}:00 - perfect timing for announcements and offers`,
      impact: "medium",
      effort: "low",
      estimatedRoi: "150-250%",
      actionItems: [
        `Schedule posts for ${peakHour}:00 local time`,
        "Launch flash sales during peak hours",
        "Send product announcements at optimal times",
        "Time email campaigns for maximum visibility"
      ]
    });

    // Retention strategy
    const activeUsers = challenge.enrollments.filter((e: any) =>
      e.checkins.some((c: any) => new Date(c.createdAt).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000)
    ).length;
    const retentionRate = totalParticipants > 0 ? (activeUsers / totalParticipants) * 100 : 0;
    
    if (retentionRate < 60) {
      insights.push({
        id: "retention_improvement",
        type: "retention_strategy",
        title: "Retention Boost Opportunity",
        description: `${Math.round(retentionRate)}% retention rate - implement engagement tactics to improve conversions`,
        impact: "high",
        effort: "medium",
        estimatedRoi: "250-400%",
        actionItems: [
          "Create re-engagement email series",
          "Offer personalized check-in reminders",
          "Implement gamification elements",
          "Provide exclusive content for returning users"
        ]
      });
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Marketing insights error:", error);
    return NextResponse.json(
      { error: "Failed to load marketing insights" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
