import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    // SICHERHEIT: Nur Admins können Analytics einsehen
    await requireAdmin();
    const user = await getCurrentUser();
    
    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { challengeId } = await params;
    
    // 🔒 TENANT ISOLATION: Get challenge with detailed analytics data only from same tenant
    const challenge = await prisma.challenge.findUnique({
      where: { 
        id: challengeId,
        tenantId: user.tenantId  // 🔒 SECURITY: Only allow access to same tenant
      },
      include: {
        enrollments: {
          include: {
            checkins: {
              orderBy: { createdAt: 'asc' }
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

    // Calculate analytics
    const totalParticipants = challenge.enrollments.length;
    const activeParticipants = challenge.enrollments.filter((e: any) => 
      e.checkins.some((c: any) => 
        new Date(c.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      )
    ).length;

    // Calculate challenge duration first (used in user analytics)
    const challengeDurationDays = Math.ceil(
      (new Date(challenge.endAt).getTime() - new Date(challenge.startAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate completion rate and engagement per user
    const userAnalytics = challenge.enrollments.map((enrollment: any) => {
      const checkinCount = enrollment.checkins.length;
      const userCompletionRate = challengeDurationDays > 0 ? Math.min((checkinCount / challengeDurationDays) * 100, 100) : 0;
      
      // Calculate engagement score (0-10) based on consistency and activity
      const daysSinceJoin = Math.ceil((Date.now() - new Date(enrollment.joinedAt).getTime()) / (1000 * 60 * 60 * 24));
      const expectedCheckins = Math.min(daysSinceJoin, challengeDurationDays);
      const consistencyScore = expectedCheckins > 0 ? (checkinCount / expectedCheckins) * 5 : 0;
      const activityScore = Math.min(checkinCount * 0.5, 5);
      const engagementScore = Math.min(consistencyScore + activityScore, 10);

      return {
        ...enrollment,
        checkinCount,
        userCompletionRate: Math.round(userCompletionRate),
        engagementScore: Math.round(engagementScore * 10) / 10,
        isHighEngagement: engagementScore >= 7,
        isNearCompletion: userCompletionRate >= 70 && userCompletionRate <= 85,
        isPremiumTarget: userCompletionRate >= 75 && engagementScore >= 7
      };
    });

  // Calculate completion rate
    const expectedCheckins = challengeDurationDays * totalParticipants;
    const actualCheckins = challenge.enrollments.reduce((sum: number, e: any) => sum + e.checkins.length, 0);
    const completionRate = expectedCheckins > 0 ? Math.round((actualCheckins / expectedCheckins) * 100) : 0;

    // Calculate engagement score (simplified)
    const avgCheckinsPerParticipant = totalParticipants > 0 ? actualCheckins / totalParticipants : 0;
    const avgEngagement = totalParticipants > 0 
      ? Math.round((userAnalytics.reduce((sum: number, u: any) => sum + u.engagementScore, 0) / totalParticipants) * 10) / 10
      : 0;

    // Daily checkins for the last 7 days
    const now = new Date();
    const dailyCheckins = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const checkinsCount = challenge.enrollments.reduce((sum: number, e: any) => {
        return sum + e.checkins.filter((c: any) => {
          const checkinDate = new Date(c.createdAt);
          return checkinDate >= date && checkinDate < nextDate;
        }).length;
      }, 0);
      
      dailyCheckins.push({
        date: date.toISOString().split('T')[0],
        count: checkinsCount
      });
    }

    // Top performers
    const topPerformers = userAnalytics
      .sort((a: any, b: any) => b.checkinCount - a.checkinCount)
      .slice(0, 10)
      .map((u: any) => ({
        userId: u.user.id,
        userName: u.user.name || u.user.email || 'Anonymous',
        checkinCount: u.checkinCount
      }));

    // Premium targeting analytics
    const highEngagementUsers = userAnalytics.filter((u: any) => u.isHighEngagement).length;
    const nearCompletionUsers = userAnalytics.filter((u: any) => u.isNearCompletion).length;
    const premiumTargets = userAnalytics
      .filter((u: any) => u.isPremiumTarget)
      .sort((a: any, b: any) => b.engagementScore - a.engagementScore)
      .slice(0, 20)
      .map((u: any) => ({
        userId: u.user.id,
        userName: u.user.name || u.user.email || 'Anonymous',
        completionRate: u.userCompletionRate,
        engagementScore: u.engagementScore,
        recommendedOffer: u.userCompletionRate >= 75 ? '30% Premium Rabatt' : '20% Milestone Bonus',
        estimatedValue: u.engagementScore >= 8 ? 67 : u.engagementScore >= 7 ? 47 : 27
      }));

    const avgRevenuePerUser = premiumTargets.length > 0 
      ? Math.round(premiumTargets.reduce((sum: number, t: any) => sum + t.estimatedValue, 0) / premiumTargets.length)
      : 0;

    // Mock engagement data (in a real app, this would come from actual tracking)
    const engagement = {
      views: Math.floor(totalParticipants * 2.5 + Math.random() * 100),
      shares: Math.floor(totalParticipants * 0.3 + Math.random() * 20),
      avgTimeSpent: Math.floor(15 + Math.random() * 30)
    };

    const analytics = {
      challengeId,
      totalParticipants,
      activeParticipants,
      completionRate,
      avgEngagement,
      dailyCheckins,
      topPerformers,
      retentionRate: Math.round((activeParticipants / totalParticipants) * 100) || 0,
      conversionPotential: Math.round(completionRate * 0.8), // Simplified calculation
      engagement,
      monetization: {
        highEngagementUsers,
        nearCompletionUsers,
        premiumTargets,
        conversionPotential: Math.round((premiumTargets.length / Math.max(totalParticipants, 1)) * 100),
        avgRevenuePerUser
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
