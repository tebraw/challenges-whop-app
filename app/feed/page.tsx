// app/feed/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getUserAccessLevel, type AccessControlResult } from "@/lib/access-control-client";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Calendar, Users, Award, Flame, CheckCircle, Clock, Star, Play } from "lucide-react";
import Button from "@/components/ui/Button";

type Challenge = {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  imageUrl?: string;
  _count?: { enrollments: number };
  creator?: { name: string; };
  rules?: any;
  // Customer-specific fields
  userParticipation?: {
    isParticipating: boolean;
    stats?: {
      currentStreak: number;
      totalCheckIns: number;
      canCheckInToday: boolean;
      hasCheckedInToday: boolean;
      joinedAt: string;
      lastCheckin?: string;
    };
  };
  status?: 'upcoming' | 'active' | 'ended';
  progress?: {
    totalDays: number;
    daysElapsed: number;
    daysRemaining: number;
  };
};

export default function FeedPage() {
  const [userAccess, setUserAccess] = useState<AccessControlResult | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Check user access
        const access = await getUserAccessLevel();
        setUserAccess(access);

        // If user can't view feed, don't load challenges
        if (!access.canViewMyFeed) {
          setLoading(false);
          return;
        }

        // Load challenges for user's feed
        const response = await fetch('/api/challenges');
        if (response.ok) {
          const data = await response.json();
          let challengesWithStatus = data.challenges || [];

          // For customers, load participation status for each challenge
          if (access.userType === 'customer') {
            const challengesWithParticipation = await Promise.all(
              challengesWithStatus.map(async (challenge: Challenge) => {
                try {
                  const statusResponse = await fetch(`/api/challenges/${challenge.id}/status`);
                  if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    return {
                      ...challenge,
                      userParticipation: statusData.userParticipation,
                      status: statusData.challenge.status,
                      progress: statusData.challenge.progress
                    };
                  }
                  return challenge;
                } catch (error) {
                  console.error(`Error loading status for challenge ${challenge.id}:`, error);
                  return challenge;
                }
              })
            );
            challengesWithStatus = challengesWithParticipation;
          }

          setChallenges(challengesWithStatus);
        }
      } catch (error) {
        console.error('Error loading feed:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-panel rounded w-1/3"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-48 bg-panel"></Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has access to this page
  if (!userAccess?.canViewMyFeed) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <Card className="py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Restricted</h1>
            <p className="text-muted mb-6">
              You need to be logged in as a customer or company owner to view your feed.
            </p>
            <Link 
              href="/auth/whop" 
              className="inline-block bg-brand text-brand-foreground px-6 py-3 rounded-lg hover:bg-brand/90 transition-colors"
            >
              Sign In
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Feed</h1>
          <p className="text-muted">
            {userAccess.userType === 'customer' 
              ? 'Challenges from creators you follow and participate in'
              : 'Your challenges and community activity'
            }
          </p>
        </div>

        {challenges.length === 0 ? (
          <Card className="text-center py-12">
            <h2 className="text-xl font-semibold text-foreground mb-4">No challenges yet</h2>
            <p className="text-muted mb-6">
              {userAccess.userType === 'customer' 
                ? 'Start following creators and join challenges to see them here.'
                : 'Create your first challenge to get started!'
              }
            </p>
            <Link 
              href={userAccess.userType === 'customer' ? '/discover' : '/admin/new'}
              className="inline-block bg-brand text-brand-foreground px-6 py-3 rounded-lg hover:bg-brand/90 transition-colors"
            >
              {userAccess.userType === 'customer' ? 'Discover Challenges' : 'Create Challenge'}
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                  {challenge.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={challenge.imageUrl}
                        alt={challenge.title}
                        className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <Link href={`/c/${challenge.id}`}>
                        <h3 className="text-lg font-semibold text-foreground hover:text-brand transition-colors truncate">
                          {challenge.title}
                        </h3>
                      </Link>
                      
                      {/* Customer-specific status badges */}
                      {userAccess?.userType === 'customer' && challenge.userParticipation && (
                        <div className="flex flex-wrap gap-2">
                          {challenge.userParticipation.isParticipating ? (
                            <>
                              <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                <CheckCircle className="w-3 h-3" />
                                <span>Joined</span>
                              </div>
                              {challenge.userParticipation.stats && (
                                <>
                                  <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                                    <Flame className="w-3 h-3" />
                                    <span>{challenge.userParticipation.stats.currentStreak} streak</span>
                                  </div>
                                  {challenge.userParticipation.stats.canCheckInToday && !challenge.userParticipation.stats.hasCheckedInToday && (
                                    <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                      <Clock className="w-3 h-3" />
                                      <span>Can check in</span>
                                    </div>
                                  )}
                                  {challenge.userParticipation.stats.hasCheckedInToday && (
                                    <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                      <Star className="w-3 h-3" />
                                      <span>Checked in today</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                              <Play className="w-3 h-3" />
                              <span>Available to join</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {challenge.description && (
                      <p className="text-muted text-sm mb-3 line-clamp-2">
                        {challenge.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(challenge.startAt).toLocaleDateString()} - {new Date(challenge.endAt).toLocaleDateString()}
                        </span>
                      </div>
                      {challenge._count?.enrollments && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{challenge._count.enrollments} participants</span>
                        </div>
                      )}
                      {challenge.rules?.rewards?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>{challenge.rules.rewards.length} rewards</span>
                        </div>
                      )}
                      
                      {/* Customer progress indicator */}
                      {userAccess?.userType === 'customer' && challenge.progress && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{challenge.progress.daysRemaining} days left</span>
                        </div>
                      )}
                    </div>

                    {/* Customer action buttons */}
                    {userAccess?.userType === 'customer' && challenge.userParticipation && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Link href={`/c/${challenge.id}`}>
                          <Button 
                            variant="outline" 
                            className="text-xs px-3 py-1"
                          >
                            {challenge.userParticipation.isParticipating ? 'View Progress' : 'Join Challenge'}
                          </Button>
                        </Link>
                        
                        {challenge.userParticipation.isParticipating && 
                         challenge.userParticipation.stats?.canCheckInToday && 
                         !challenge.userParticipation.stats?.hasCheckedInToday && (
                          <Link href={`/c/${challenge.id}#checkin`}>
                            <Button 
                              className="bg-brand text-brand-foreground hover:bg-brand/90 text-xs px-3 py-1"
                            >
                              Quick Check-in
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
