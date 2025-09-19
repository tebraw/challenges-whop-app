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
          <div className="space-y-4">
            {challenges.map((challenge) => {
              const status = new Date() < new Date(challenge.startAt) ? 'upcoming' : 
                            new Date() > new Date(challenge.endAt) ? 'ended' : 'active';

              return (
                <div key={challenge.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors group">
                  <Link href={`/experiences/${experienceId}/c/${challenge.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {challenge.imageUrl ? (
                          <img
                            src={challenge.imageUrl}
                            alt={challenge.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Award className="w-8 h-8 text-white" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {challenge.title}
                            </h3>
                            {status === 'upcoming' && (
                              <span className="px-2 py-1 bg-green-600 text-green-100 text-xs font-medium rounded">
                                Geplant
                              </span>
                            )}
                            {status === 'active' && (
                              <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs font-medium rounded">
                                Live
                              </span>
                            )}
                            {challenge.userParticipation?.isParticipating && (
                              <span className="px-2 py-1 bg-purple-600 text-purple-100 text-xs font-medium rounded">
                                Joined
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(challenge.startAt).toLocaleDateString()} - {new Date(challenge.endAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {challenge._count?.enrollments || 0} participants
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                        Open →
                      </button>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
