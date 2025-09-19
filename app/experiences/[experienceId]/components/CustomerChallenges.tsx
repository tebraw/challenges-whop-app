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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Challenges</h1>
          <p className="text-gray-400">
            Your active challenges and progress overview
          </p>
          
          {/* Tab Navigation */}
          <div className="flex gap-4 mt-6">
            <div className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium">
              My Challenges
            </div>
            <Link 
              href={`/experiences/${experienceId}/discover`}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🔍 Discover All
            </Link>
          </div>
        </div>

        {challenges.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No challenges yet</h3>
            <p className="text-gray-400 mb-6">
              Start following creators and join challenges to see them here.
            </p>
            <Link 
              href={`/experiences/${experienceId}/discover`}
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              🔍 Discover Challenges
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const status = new Date() < new Date(challenge.startAt) ? 'upcoming' : 
                            new Date() > new Date(challenge.endAt) ? 'ended' : 'active';
              
              const statusColor = status === 'upcoming' ? 'text-blue-400' : 
                                 status === 'ended' ? 'text-gray-400' : 'text-green-400';
              
              const statusIcon = status === 'upcoming' ? <Clock className="h-4 w-4" /> : 
                                status === 'ended' ? <Award className="h-4 w-4" /> : 
                                <Star className="h-4 w-4" />;

              return (
                <Link href={`/experiences/${experienceId}/c/${challenge.id}`} key={challenge.id} className="block">
                  <div className="group bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-[1.02]">
                    {/* Challenge Image */}
                    <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                      {challenge.imageUrl ? (
                        <img 
                          src={challenge.imageUrl} 
                          alt={challenge.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">🎯</span>
                      )}
                    </div>
                    
                    {/* Challenge Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`flex items-center gap-1 text-xs font-medium ${statusColor}`}>
                          {statusIcon}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </div>
                        {challenge.userParticipation?.isParticipating && (
                          <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
                            ⭐ Joined
                          </span>
                        )}
                        {challenge.userParticipation?.stats?.hasCheckedInToday && (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                            ✅ Checked Today
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-white text-lg mb-2 hover:text-purple-400 transition-colors">
                        {challenge.title}
                      </h3>
                      
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                        {challenge.description}
                      </p>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{challenge._count?.enrollments || 0} participants</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(challenge.startAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* Progress bar for participating users */}
                      {challenge.userParticipation?.isParticipating && challenge.userParticipation?.stats && (
                        <div className="mb-4">
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

                      {/* Additional Status badges */}
                      {challenge.userParticipation?.stats && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-300 px-3 py-1 rounded-full text-xs font-medium">
                            📊 {challenge.userParticipation.stats.completedCheckIns}/{challenge.userParticipation.stats.maxCheckIns} check-ins
                          </div>
                          {challenge.userParticipation.stats.canCheckInToday && !challenge.userParticipation.stats.hasCheckedInToday && (
                            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 text-yellow-300 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                              ⚡ Ready to Check-in
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rewards */}
                      {challenge.rules?.rewards && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-yellow-400">🏆</span>
                            <span className="text-gray-300 font-medium">Rewards available</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Button */}
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <button className="inline-flex items-center justify-center w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105">
                          <span className="mr-2">🚀</span>
                          Open Challenge
                        </button>
                        
                        {/* Quick Check-in button if applicable */}
                        {challenge.userParticipation?.isParticipating && 
                         challenge.userParticipation?.stats?.canCheckInToday && 
                         !challenge.userParticipation?.stats?.hasCheckedInToday && (
                          <button className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-green-500/25 transform hover:scale-105 flex items-center gap-2 w-full justify-center">
                            <span>⚡</span>
                            <span>Quick Check-in</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
