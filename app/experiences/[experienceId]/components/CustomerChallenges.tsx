'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import { Flame, CheckCircle, Clock, Star } from 'lucide-react';

interface CustomerChallengesProps {
  experienceId: string;
  user: User;
  whopUser: any;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  endAt: string | null;
  participantCount: number;
  isParticipating: boolean;
  status: 'active' | 'ended';
  proofType: string;
  // Enhanced customer fields
  userStats?: {
    currentStreak: number;
    totalCheckIns: number;
    canCheckInToday: boolean;
    hasCheckedInToday: boolean;
    joinedAt: string;
    lastCheckin?: string;
  };
  progress?: {
    totalDays: number;
    daysElapsed: number;
    daysRemaining: number;
  };
  rewards?: {
    place: number;
    title: string;
  }[];
}

export default function CustomerChallenges({ experienceId, user, whopUser }: CustomerChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'participating' | 'available'>('all');

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
        const challengesWithEnhancedData = await Promise.all(
          challengesWithStatus.map(async (challenge: any) => {
            // Transform rewards from rules.rewards object to array
            let rewards: { place: number; title: string }[] = [];
            if (challenge.rules?.rewards) {
              const rewardsObj = challenge.rules.rewards;
              if (rewardsObj.first) rewards.push({ place: 1, title: rewardsObj.first });
              if (rewardsObj.second) rewards.push({ place: 2, title: rewardsObj.second });
              if (rewardsObj.third) rewards.push({ place: 3, title: rewardsObj.third });
            }

            const transformedChallenge = {
              id: challenge.id,
              title: challenge.title,
              description: challenge.description,
              imageUrl: challenge.imageUrl,
              endAt: challenge.endAt,
              participantCount: challenge._count?.enrollments || 0,
              isParticipating: !!challenge.enrollment,
              status: challenge.isActive ? 'active' as const : 'ended' as const,
              proofType: challenge.proofType,
              rewards: rewards
            };

            if (transformedChallenge.isParticipating) {
              try {
                const statusResponse = await fetch(`/api/challenges/${challenge.id}/status`);
                if (statusResponse.ok) {
                  const statusData = await statusResponse.json();
                  return {
                    ...transformedChallenge,
                    userStats: statusData.userParticipation?.stats,
                    progress: statusData.challenge?.progress
                  };
                }
                return transformedChallenge;
              } catch (error) {
                console.error(`Error loading status for challenge ${challenge.id}:`, error);
                return transformedChallenge;
              }
            }
            return transformedChallenge;
          })
        );
        
        setChallenges(challengesWithEnhancedData);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    if (filter === 'participating') return challenge.isParticipating;
    if (filter === 'available') return !challenge.isParticipating && challenge.status === 'active';
    return true;
  });

  const joinChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/experience/${experienceId}/challenges/${challengeId}/join`, {
        method: 'POST'
      });
      if (response.ok) {
        fetchChallenges(); // Refresh
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                🏆 Challenges
              </h1>
              <p className="text-blue-100">
                Welcome {user.name}! Take on exciting challenges and win amazing prizes.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Logged in as</div>
              <div className="font-semibold">{whopUser.username}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: 'all', label: 'All Challenges', count: challenges.length },
            { key: 'participating', label: 'My Challenges', count: challenges.filter(c => c.isParticipating).length },
            { key: 'available', label: 'Available', count: challenges.filter(c => !c.isParticipating && c.status === 'active').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                ✅
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Participating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {challenges.filter(c => c.isParticipating).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                🎯
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {challenges.filter(c => !c.isParticipating && c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                🏆
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Challenges</p>
                <p className="text-2xl font-bold text-gray-900">
                  {challenges.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Challenges Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading challenges...</p>
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {filter === 'participating' ? '📝' : filter === 'available' ? '🎯' : '🏆'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'participating' ? 'No active participations' :
               filter === 'available' ? 'No available challenges' :
               'No challenges found'}
            </h3>
            <p className="text-gray-600">
              {filter === 'participating' ? 'Join some challenges to see them here!' :
               filter === 'available' ? 'Check back later for new challenges.' :
               'There are no challenges in this experience yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredChallenges.map((challenge) => (
              <div key={challenge.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                {/* Challenge Image */}
                {challenge.imageUrl && (
                  <div className="h-32 sm:h-48 bg-gray-200 overflow-hidden">
                    <img 
                      src={challenge.imageUrl} 
                      alt={challenge.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {challenge.title}
                    </h3>
                    <div className="flex flex-col items-end space-y-1">
                      {challenge.isParticipating && (
                        <div className="flex flex-wrap gap-1 justify-end">
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Participating
                          </span>
                          
                          {/* Enhanced status badges */}
                          {challenge.userStats && (
                            <>
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                {challenge.userStats.currentStreak} streak
                              </span>
                              
                              {challenge.userStats.canCheckInToday && !challenge.userStats.hasCheckedInToday && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Can check in
                                </span>
                              )}
                              
                              {challenge.userStats.hasCheckedInToday && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  Checked in today
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        challenge.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {challenge.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {challenge.description}
                  </p>
                  
                  {/* Rewards Section */}
                  {challenge.rewards && challenge.rewards.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                        🏆 Rewards
                      </h4>
                      <div className="space-y-1">
                        {challenge.rewards.slice(0, 3).map((reward, index) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                            <span className="font-medium text-yellow-800">
                              #{reward.place} Place
                            </span>
                            <span className="text-yellow-700">
                              {reward.title}
                            </span>
                          </div>
                        ))}
                        {challenge.rewards.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{challenge.rewards.length - 3} more rewards
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Meta Info */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-500 mb-4 gap-2">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-1">
                        👥 <span className="text-xs sm:text-sm">{challenge.participantCount} participants</span>
                      </div>
                      {challenge.userStats && (
                        <div className="flex items-center gap-1">
                          ✅ <span className="text-xs sm:text-sm">{challenge.userStats.totalCheckIns} check-ins</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-start sm:items-end text-xs gap-1">
                      {challenge.endAt && (
                        <div className="flex items-center gap-1">
                          ⏰ Ends {new Date(challenge.endAt).toLocaleDateString()}
                        </div>
                      )}
                      {challenge.progress && (
                        <div className="flex items-center gap-1">
                          📅 {challenge.progress.daysRemaining} days left
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="space-y-2">
                    {challenge.isParticipating ? (
                      <div className="space-y-2">
                        <button 
                          onClick={() => window.open(`/c/${challenge.id}`, '_blank')}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
                        >
                          View My Progress
                        </button>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {challenge.userStats?.canCheckInToday && !challenge.userStats?.hasCheckedInToday && (
                            <button 
                              onClick={() => window.open(`/c/${challenge.id}#checkin`, '_blank')}
                              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Quick Check-in
                            </button>
                          )}
                          
                          {challenge.proofType && (
                            <button 
                              onClick={() => window.open(`/c/${challenge.id}#proof`, '_blank')}
                              className="border border-green-600 text-green-600 hover:bg-green-50 py-2 px-3 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                            >
                              <Star className="w-4 h-4" />
                              Submit {challenge.proofType === 'image' ? 'Photo' : 'Proof'}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : challenge.status === 'active' ? (
                      <button 
                        onClick={() => joinChallenge(challenge.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
                      >
                        Join Challenge
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="w-full bg-gray-300 text-gray-500 py-2 sm:py-3 px-4 rounded-lg font-medium cursor-not-allowed text-sm sm:text-base"
                      >
                        Challenge Ended
                      </button>
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
