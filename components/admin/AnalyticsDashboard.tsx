"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Progress from "@/components/ui/Progress";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar, 
  Award, 
  Eye,
  Share2,
  DollarSign,
  BarChart3,
  Zap,
  Gift,
  TrendingDown
} from "lucide-react";

interface AnalyticsData {
  challengeId: string;
  totalParticipants: number;
  activeParticipants: number;
  completionRate: number;
  avgEngagement: number;
  dailyCheckins: Array<{ date: string; count: number }>;
  topPerformers: Array<{ userId: string; userName: string; checkinCount: number }>;
  retentionRate: number;
  conversionPotential: number;
  engagement: {
    views: number;
    shares: number;
    avgTimeSpent: number;
  };
  // New monetization analytics
  monetization: {
    highEngagementUsers: number;
    nearCompletionUsers: number; // Users at 70-80% completion
    premiumTargets: Array<{
      userId: string;
      userName: string;
      completionRate: number;
      engagementScore: number;
      recommendedOffer: string;
      estimatedValue: number;
    }>;
    conversionPotential: number;
    avgRevenuePerUser: number;
  };
}

interface AnalyticsDashboardProps {
  challengeId: string;
}

export default function AnalyticsDashboard({ challengeId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch(`/api/admin/analytics/${challengeId}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [challengeId]);

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          title="Total Participants"
          value={analytics.totalParticipants}
          subtitle={`${analytics.activeParticipants} active`}
          trend="+12%"
          trendUp={true}
        />
        
        <MetricCard
          icon={<Target className="h-5 w-5" />}
          title="Completion Rate"
          value={`${analytics.completionRate}%`}
          subtitle="Challenge progress"
          trend="+5%"
          trendUp={true}
        />
        
        <MetricCard
          icon={<Award className="h-5 w-5" />}
          title="Engagement Score"
          value={`${analytics.avgEngagement}/10`}
          subtitle="User engagement"
          trend="+8%"
          trendUp={true}
        />
        
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          title="Revenue Potential"
          value={`$${analytics.monetization?.avgRevenuePerUser || 0}/user`}
          subtitle="Avg. per user"
          trend="+15%"
          trendUp={true}
        />
        
        <MetricCard
          icon={<Zap className="h-5 w-5" />}
          title="Premium Targets"
          value={analytics.monetization?.nearCompletionUsers || 0}
          subtitle="75% completion"
          trend="+22%"
          trendUp={true}
        />
      </div>

      {/* Engagement Overview */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Engagement Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Challenge Views
                </span>
                <span className="font-semibold">{analytics.engagement.views}</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Social Shares
                </span>
                <span className="font-semibold">{analytics.engagement.shares}</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Avg. Time Spent
                </span>
                <span className="font-semibold">{analytics.engagement.avgTimeSpent}min</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Activity Chart */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Check-ins</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.dailyCheckins.slice(-7).map((day, index) => {
              const maxCheckins = Math.max(...analytics.dailyCheckins.map(d => d.count));
              const height = (day.count / maxCheckins) * 100;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-brand rounded-t-md min-h-[4px] transition-all hover:bg-brand/80"
                    style={{ height: `${height}%` }}
                    title={`${day.count} check-ins`}
                  />
                  <div className="text-xs text-muted mt-2">
                    {new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short' })}
                  </div>
                  <div className="text-xs font-semibold">{day.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Top Performers */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
          <div className="space-y-3">
            {analytics.topPerformers.slice(0, 5).map((performer, index) => (
              <div key={performer.userId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand text-black font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{performer.userName}</div>
                    <div className="text-sm text-muted">{performer.checkinCount} check-ins</div>
                  </div>
                </div>
                <Award className="h-5 w-5 text-brand" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Premium Monetization Targets */}
      {analytics.monetization && analytics.monetization.premiumTargets.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Premium Offer Targets
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                High Conversion Potential
              </span>
            </h3>
            <div className="space-y-3">
              {analytics.monetization.premiumTargets.slice(0, 10).map((target) => (
                <div key={target.userId} className="flex items-center justify-between p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white font-bold text-sm">
                      {target.completionRate}%
                    </div>
                    <div>
                      <div className="font-medium">{target.userName}</div>
                      <div className="text-sm text-muted">
                        Engagement: {target.engagementScore}/10 • Est. Value: ${target.estimatedValue}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {target.recommendedOffer}
                      </div>
                      <div className="text-xs text-muted">
                        Recommended Offer
                      </div>
                    </div>
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">Smart Targeting Insights</span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                • {analytics.monetization.nearCompletionUsers} users are at 75%+ completion (prime for premium offers)
                <br />
                • {analytics.monetization.highEngagementUsers} users show high engagement patterns
                <br />
                • Estimated total revenue potential: ${Math.round(analytics.monetization.avgRevenuePerUser * analytics.monetization.nearCompletionUsers)}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: string;
  trendUp?: boolean;
}

function MetricCard({ icon, title, value, subtitle, trend, trendUp }: MetricCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-muted">{icon}</div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              <TrendingUp className={`h-4 w-4 ${!trendUp && 'rotate-180'}`} />
              {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-muted">{subtitle}</div>
        </div>
      </div>
    </Card>
  );
}
