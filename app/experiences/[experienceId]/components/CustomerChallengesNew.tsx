'use client';

import { useState, useEffect } from 'react';
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
  userParticipation?: {
    isParticipating: boolean;
    stats?: {
      completedCheckIns: number;
      maxCheckIns: number;
      completionRate: number;
      currentStreak: number;
      canCheckInToday: boolean;
      hasCheckedInToday: boolean;
      rank?: number;
      points?: number;
    };
  };
}

export default function CustomerChallenges({ experienceId, user, whopUser }: CustomerChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/experience/${experienceId}/challenges/customer`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      const data = await response.json();
      setChallenges(data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setError('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (challenge: Challenge) => {
    const now = new Date();
    const startDate = new Date(challenge.startAt);
    const endDate = new Date(challenge.endAt);
    
    if (now < startDate) return 'bg-gray-100 text-gray-600';
    if (now > endDate) return 'bg-red-100 text-red-600';
    if (challenge.userParticipation?.isParticipating) return 'bg-blue-100 text-blue-600';
    return 'bg-green-100 text-green-600';
  };

  const getStatusText = (challenge: Challenge) => {
    const now = new Date();
    const startDate = new Date(challenge.startAt);
    const endDate = new Date(challenge.endAt);
    
    if (now < startDate) return 'Upcoming';
    if (now > endDate) return 'Ended';
    if (challenge.userParticipation?.isParticipating) return 'Joined';
    return 'Active';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Challenges</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading challenges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Challenges</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchChallenges}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Challenges</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Star className="h-4 w-4" />
          <span>{challenges.filter(c => c.userParticipation?.isParticipating).length} Joined</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {challenges.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Challenges Available</h3>
            <p className="text-gray-600">Check back later for new challenges!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <div 
                key={challenge.id} 
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {challenge.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge)}`}>
                          {getStatusText(challenge)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {challenge.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(challenge.startAt)} - {formatDate(challenge.endAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{challenge._count?.enrollments || 0} participants</span>
                        </div>
                        {challenge.creator && (
                          <div className="flex items-center gap-1">
                            <span>by {challenge.creator.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {challenge.imageUrl && (
                      <div className="ml-4 flex-shrink-0">
                        <img 
                          src={challenge.imageUrl} 
                          alt={challenge.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {challenge.userParticipation?.isParticipating && challenge.userParticipation.stats && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {challenge.userParticipation.stats.completedCheckIns}
                          </div>
                          <div className="text-xs text-gray-600">Check-ins</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {challenge.userParticipation.stats.completionRate}%
                          </div>
                          <div className="text-xs text-gray-600">Completion</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-orange-600">
                            {challenge.userParticipation.stats.currentStreak}
                          </div>
                          <div className="text-xs text-gray-600">Day Streak</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-600">
                            {challenge.userParticipation.stats.points || 0}
                          </div>
                          <div className="text-xs text-gray-600">Points</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {challenge.userParticipation?.stats?.hasCheckedInToday && (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Checked in today</span>
                        </div>
                      )}
                    </div>
                    
                    {getStatusText(challenge) !== 'Ended' && (
                      <div className="flex items-center gap-2">
                        <Link href={`/c/${challenge.id}`}>
                          <button 
                            className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                              challenge.userParticipation?.isParticipating 
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {challenge.userParticipation?.isParticipating ? 'View Progress' : 'Join Challenge'}
                          </button>
                        </Link>
                        
                        {challenge.userParticipation?.isParticipating && 
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
