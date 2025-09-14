'use client';

import { useState, useEffect } from 'react';
// import { User } from '@prisma/client';
import { Calendar, Users, Award, Flame, CheckCircle, Clock, Star, Play, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface CustomerChallengesProps {
  experienceId: string;
  user: any;
  whopUser: any;
  initialChallenges?: any[];
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

export default function CustomerChallenges({ 
  experienceId, 
  user, 
  whopUser, 
  initialChallenges = [] 
}: CustomerChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges as Challenge[]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no initial challenges provided, fetch them
    if (initialChallenges.length === 0) {
      fetchChallenges();
    }
  }, [initialChallenges]);

  const fetchChallenges = async () => {
    try {
      // Use the main challenges API which supports tenant-based filtering
      const response = await fetch('/api/challenges');
      if (response.ok) {
        const data = await response.json();
        let challengesWithStatus = data.challenges || [];

        console.log('🎯 Loaded challenges from main API:', challengesWithStatus.length);

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
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <Link href={`/experiences/${experienceId}/c/${challenge.id}`} key={challenge.id} className="block">
                <div className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-4 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm cursor-pointer hover:bg-gray-800/90">
                <div className="flex gap-6">
                  {/* Challenge Image */}
                  {challenge.imageUrl ? (
                    <div className="flex-shrink-0">
                      <img
                        src={challenge.imageUrl}
                        alt={challenge.title}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border-2 border-gray-600/50 group-hover:border-purple-400/50 transition-all duration-300"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border-2 border-purple-500/20 group-hover:border-purple-400/50 transition-all duration-300">
                      🎯
                    </div>
                  )}

                  {/* Challenge Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors line-clamp-2">
                          {challenge.title}
                        </h3>
                        
                        {challenge.description && (
                          <p className="text-gray-300 text-sm mb-3 line-clamp-2 leading-relaxed">
                            {challenge.description}
                          </p>
                        )}

                        {/* Info Row with Emojis */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
                          {/* Participants */}
                          {challenge._count?.enrollments !== undefined && (
                            <div className="flex items-center gap-1">
                              <span>👥</span>
                              <span>{challenge._count.enrollments} participants</span>
                            </div>
                          )}
                          
                          {/* Date */}
                          <div className="flex items-center gap-1">
                            <span>📅</span>
                            <span>
                              {new Date(challenge.startAt).toLocaleDateString()} - {new Date(challenge.endAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {/* Rewards */}
                          {challenge.rules?.rewards && (
                            <div className="flex items-center gap-1">
                              <span>🏆</span>
                              <span>Rewards available</span>
                            </div>
                          )}
                        </div>

                        {/* Status badges */}
                        {challenge.userParticipation && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {challenge.userParticipation.isParticipating ? (
                              <>
                                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-300 px-3 py-1 rounded-full text-xs font-medium">
                                  ⭐ Joined
                                </div>
                                {challenge.userParticipation.stats && (
                                  <>
                                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-300 px-3 py-1 rounded-full text-xs font-medium">
                                      📊 {challenge.userParticipation.stats.completedCheckIns}/{challenge.userParticipation.stats.maxCheckIns} check-ins
                                    </div>
                                    {challenge.userParticipation.stats.canCheckInToday && !challenge.userParticipation.stats.hasCheckedInToday && (
                                      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 text-yellow-300 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                                        ⚡ Ready to Check-in
                                      </div>
                                    )}
                                    {challenge.userParticipation.stats.hasCheckedInToday && (
                                      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                                        ✅ Checked in Today
                                      </div>
                                    )}
                                  </>
                                )}
                              </>
                            ) : (
                              <div className="bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/40 text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                                🚀 Available to join
                              </div>
                            )}
                          </div>
                        )}

                        {/* Progress bar for participating users */}
                        {challenge.userParticipation?.isParticipating && challenge.userParticipation?.stats && (
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-300">Your Progress</span>
                              <span className="text-sm font-medium text-purple-400">
                                {Math.round(challenge.userParticipation.stats.completionRate)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${challenge.userParticipation.stats.completionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Open Button - Rechts */}
                      <div className="flex-shrink-0">
                        <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 flex items-center gap-2">
                          <span>🚀</span>
                          <span>Open Challenge</span>
                        </button>
                        
                        {/* Quick Check-in button if applicable */}
                        {challenge.userParticipation?.isParticipating && 
                         challenge.userParticipation?.stats?.canCheckInToday && 
                         !challenge.userParticipation?.stats?.hasCheckedInToday && (
                          <Link href={`/experiences/${experienceId}/c/${challenge.id}#checkin`}>
                            <button className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl transition-all duration-300 font-medium text-xs shadow-lg hover:shadow-green-500/25 transform hover:scale-105 flex items-center gap-2 w-full justify-center">
                              <span>⚡</span>
                              <span>Quick Check-in</span>
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
