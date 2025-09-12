'use client';

import { useState, useEffect } from 'react';
// import { User } from '@prisma/client';
import { Calendar, Users, Award, Flame, CheckCircle, Clock, Star, Play, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface CustomerChallengesProps {
  experienceId: string;
  user: any;
  whopUser: any;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startAt: string;
  endAt: string;
  _count?: { enrollments: number };
  creator?: { name: string; };
  rules?: any;
  // Customer-specific fields
  userParticipation?: {
    isParticipating: boolean;
    stats?: {
      completedCheckIns: number;
      maxCheckIns: number;
      completionRate: number;
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
}

export default function CustomerChallenges({ experienceId, user, whopUser }: CustomerChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch(`/api/experience/${experienceId}/challenges/customer`);
      if (response.ok) {
        const data = await response.json();
        let challengesWithStatus = data.challenges || [];

        // Load enhanced participation status for each challenge
        const challengesWithParticipation = await Promise.all(
          challengesWithStatus.map(async (challenge: any) => {
            try {
              const statusResponse = await fetch(`/api/challenges/${challenge.id}/status`);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                return {
                  id: challenge.id,
                  title: challenge.title,
                  description: challenge.description,
                  imageUrl: challenge.imageUrl,
                  startAt: challenge.startAt,
                  endAt: challenge.endAt,
                  _count: challenge._count,
                  rules: challenge.rules,
                  userParticipation: statusData.userParticipation,
                  status: statusData.challenge.status,
                  progress: statusData.challenge.progress
                };
              }
              return {
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                imageUrl: challenge.imageUrl,
                startAt: challenge.startAt,
                endAt: challenge.endAt,
                _count: challenge._count,
                rules: challenge.rules,
                userParticipation: { isParticipating: !!challenge.enrollment }
              };
            } catch (error) {
              console.error(`Error loading status for challenge ${challenge.id}:`, error);
              return challenge;
            }
          })
        );
        setChallenges(challengesWithParticipation);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-20">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-1/3"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Feed</h1>
          <p className="text-gray-400">
            Challenges from creators you follow and participate in
          </p>
        </div>

        {challenges.length === 0 ? (
          <div className="bg-gray-800 rounded-xl text-center py-12">
            <h2 className="text-xl font-semibold text-white mb-4">No challenges yet</h2>
            <p className="text-gray-400 mb-6">
              Start following creators and join challenges to see them here.
            </p>
            <Link 
              href="/discover"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Discover Challenges
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors">
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
                        <h3 className="text-lg font-semibold text-white hover:text-blue-400 transition-colors truncate">
                          {challenge.title}
                        </h3>
                      </Link>
                      
                      {/* Customer-specific status badges */}
                      {challenge.userParticipation && (
                        <div className="flex flex-wrap gap-2">
                          {challenge.userParticipation.isParticipating ? (
                            <>
                              <div className="flex items-center gap-1 bg-green-600 text-green-100 px-2 py-1 rounded-full text-xs">
                                <CheckCircle className="w-3 h-3" />
                                <span>Joined</span>
                              </div>
                              {challenge.userParticipation.stats && (
                                <>
                                  <div className="flex items-center gap-1 bg-orange-600 text-orange-100 px-2 py-1 rounded-full text-xs">
                                    <BarChart3 className="w-3 h-3" />
                                    <span>{challenge.userParticipation.stats.completedCheckIns}/{challenge.userParticipation.stats.maxCheckIns} check-ins</span>
                                  </div>
                                  {challenge.userParticipation.stats.canCheckInToday && !challenge.userParticipation.stats.hasCheckedInToday && (
                                    <div className="flex items-center gap-1 bg-blue-600 text-blue-100 px-2 py-1 rounded-full text-xs">
                                      <Clock className="w-3 h-3" />
                                      <span>Can check in</span>
                                    </div>
                                  )}
                                  {challenge.userParticipation.stats.hasCheckedInToday && (
                                    <div className="flex items-center gap-1 bg-green-600 text-green-100 px-2 py-1 rounded-full text-xs">
                                      <Star className="w-3 h-3" />
                                      <span>Checked in today</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-1 bg-gray-600 text-gray-100 px-2 py-1 rounded-full text-xs">
                              <Play className="w-3 h-3" />
                              <span>Available to join</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {challenge.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {challenge.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
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
                      {challenge.rules?.rewards && (
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>Rewards available</span>
                        </div>
                      )}
                      
                      {/* Customer progress indicator */}
                      {challenge.progress && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{challenge.progress.daysRemaining} days left</span>
                        </div>
                      )}
                    </div>

                    {/* Customer action buttons */}
                    {challenge.userParticipation && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Link href={`/c/${challenge.id}`}>
                          <button 
                            className="border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 text-xs px-3 py-1 rounded-lg transition-colors"
                          >
                            {challenge.userParticipation.isParticipating ? 'View Progress' : 'Join Challenge'}
                          </button>
                        </Link>
                        
                        {challenge.userParticipation.isParticipating && 
                         challenge.userParticipation.stats?.canCheckInToday && 
                         !challenge.userParticipation.stats?.hasCheckedInToday && (
                          <Link href={`/c/${challenge.id}#checkin`}>
                            <button 
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                            >
                              Quick Check-in
                            </button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
