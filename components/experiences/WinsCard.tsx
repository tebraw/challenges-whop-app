'use client';

import { useEffect, useState } from 'react';
import { Trophy, Crown, Award, Star, Users, Clock } from 'lucide-react';

interface WinEntry {
  id: string;
  type: 'challenge_winner' | 'challenge_update' | 'system';
  title: string;
  message: string;
  data?: {
    challengeName?: string;
    userName?: string;
    position?: number;
    winType?: string;
    timestamp?: string;
  };
  createdAt: string;
  isRead: boolean;
}

interface WinsCardProps {
  challengeId: string;
  experienceId: string;
  userId: string;
}

export default function WinsCard({ challengeId, experienceId, userId }: WinsCardProps) {
  const [wins, setWins] = useState<WinEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWins();
  }, [challengeId, experienceId, userId]);

  const fetchWins = async () => {
    try {
      const response = await fetch(`/api/experiences/${experienceId}/wins`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Filter for this specific challenge's wins
        const challengeWins = data.wins
          .filter((win: WinEntry) => 
            win.data?.challengeName || 
            win.message.includes('challenge') ||
            win.type === 'challenge_winner' ||
            win.type === 'challenge_update'
          )
          .sort((a: WinEntry, b: WinEntry) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setWins(challengeWins);
      }
    } catch (error) {
      console.error('Error fetching wins:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWinIcon = (win: WinEntry) => {
    if (win.data?.position === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (win.data?.position === 2) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (win.data?.position === 3) return <Award className="w-6 h-6 text-orange-400" />;
    if (win.type === 'challenge_winner') return <Trophy className="w-6 h-6 text-purple-400" />;
    return <Star className="w-6 h-6 text-blue-400" />;
  };

  const getWinBadge = (win: WinEntry) => {
    if (win.data?.position === 1) return { text: '1st Place', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
    if (win.data?.position === 2) return { text: '2nd Place', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
    if (win.data?.position === 3) return { text: '3rd Place', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
    if (win.type === 'challenge_winner') return { text: 'Winner', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    return { text: 'Achievement', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="animate-pulse">
            <Trophy className="w-7 h-7 text-purple-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
            Loading Winners...
          </h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-700/30 rounded-xl h-20"></div>
          ))}
        </div>
      </div>
    );
  }

  if (wins.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-7 h-7 text-purple-400" />
          <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
            Challenge Winners
          </h2>
        </div>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No winners yet!</h3>
          <p className="text-gray-400 text-sm">
            Be the first to complete this challenge and claim your victory!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-7 h-7 text-purple-400" />
        <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
          Challenge Winners
        </h2>
        <div className="flex items-center gap-1 ml-auto">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">{wins.length} winner{wins.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Winners List */}
      <div className="space-y-4">
        {wins.slice(0, 10).map((win) => {
          const badge = getWinBadge(win);
          
          return (
            <div
              key={win.id}
              className="bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/50 hover:border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 p-2 bg-gray-700/50 rounded-lg group-hover:scale-110 transition-transform">
                  {getWinIcon(win)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-sm sm:text-base leading-tight">
                      {win.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                        {badge.text}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                    {win.message}
                  </p>
                  
                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-4">
                      {win.data?.userName && (
                        <span className="font-medium">👤 {win.data.userName}</span>
                      )}
                      {win.data?.winType && (
                        <span className="capitalize">🎯 {win.data.winType}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(win.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View More Link (if more than 10 wins) */}
      {wins.length > 10 && (
        <div className="text-center mt-6 pt-6 border-t border-gray-700/50">
          <button className="text-purple-400 hover:text-purple-300 font-medium text-sm transition-colors">
            View all {wins.length} winners →
          </button>
        </div>
      )}
    </div>
  );
}