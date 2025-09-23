'use client';

import { useState, useEffect } from 'react';
import { Trophy, Gift, Star, CheckCircle, Clock, X, ExternalLink } from 'lucide-react';

interface Win {
  id: string;
  title: string;
  message: string;
  type: string;
  winType: string;
  isRead: boolean;
  createdAt: string;
  challengeId: string;
  challengeTitle: string;
  challengeImage?: string;
  metadata?: any;
}

interface WinsByChallenge {
  challengeId: string;
  challengeTitle: string;
  challengeImage?: string;
  wins: Win[];
  totalWins: number;
  unreadWins: number;
}

interface ExperienceWinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceId: string;
  challengeId?: string; // Optional: show wins for specific challenge
  challengeTitle?: string;
}

export default function ExperienceWinsModal({ 
  isOpen, 
  onClose, 
  experienceId, 
  challengeId,
  challengeTitle 
}: ExperienceWinsModalProps) {
  const [wins, setWins] = useState<Win[]>([]);
  const [winsByChallenge, setWinsByChallenge] = useState<WinsByChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalWins, setTotalWins] = useState(0);
  const [unreadWins, setUnreadWins] = useState(0);

  useEffect(() => {
    if (isOpen && experienceId) {
      fetchWins();
    }
  }, [isOpen, experienceId, challengeId]);

  const fetchWins = async () => {
    setLoading(true);
    try {
      const url = challengeId 
        ? `/api/experiences/${experienceId}/wins?challengeId=${challengeId}`
        : `/api/experiences/${experienceId}/wins`;
        
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setWins(data.wins);
        setWinsByChallenge(data.winsByChallenge);
        setTotalWins(data.totalWins);
        setUnreadWins(data.unreadWins);
      } else {
        console.error('Failed to fetch wins:', data.error);
      }
    } catch (error) {
      console.error('Error fetching wins:', error);
    } finally {
      setLoading(false);
    }
  };

  const markWinsAsRead = async (winIds?: string[], markAllAsRead = false) => {
    try {
      const response = await fetch(`/api/experiences/${experienceId}/wins`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winIds,
          markAllAsRead,
          challengeId: challengeId
        }),
      });

      if (response.ok) {
        // Refresh wins after marking as read
        await fetchWins();
      }
    } catch (error) {
      console.error('Error marking wins as read:', error);
    }
  };

  const getWinIcon = (winType: string) => {
    switch (winType) {
      case 'Winner':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'Reward':
        return <Gift className="w-5 h-5 text-green-400" />;
      case 'Achievement':
        return <Star className="w-5 h-5 text-purple-400" />;
      default:
        return <Trophy className="w-5 h-5 text-blue-400" />;
    }
  };

  const getWinBadgeColor = (winType: string) => {
    switch (winType) {
      case 'Winner':
        return 'bg-yellow-600 text-yellow-100';
      case 'Reward':
        return 'bg-green-600 text-green-100';
      case 'Achievement':
        return 'bg-purple-600 text-purple-100';
      default:
        return 'bg-blue-600 text-blue-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 text-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-xl font-bold">
                    {challengeId ? `Wins: ${challengeTitle}` : 'Meine Gewinne'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {unreadWins > 0 && (
                    <button
                      onClick={() => markWinsAsRead(undefined, true)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                    >
                      Alle als gelesen markieren
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Summary Stats */}
              <div className="flex gap-4 text-sm text-gray-400 mt-2">
                <span>Gesamt: {totalWins} Gewinne</span>
                {unreadWins > 0 && (
                  <span className="text-blue-400">Neu: {unreadWins}</span>
                )}
              </div>
            </div>

            <div className="overflow-y-auto max-h-96 p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-400">Lade Gewinne...</span>
                </div>
              ) : wins.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    {challengeId 
                      ? 'Noch keine Gewinne in dieser Challenge' 
                      : 'Noch keine Gewinne erhalten'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Nehme an Challenges teil und erreiche Meilensteine um Gewinne zu erhalten!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* If showing all wins, group by challenge */}
                  {!challengeId && winsByChallenge.length > 0 ? (
                    winsByChallenge.map((challengeGroup) => (
                      <div key={challengeGroup.challengeId} className="space-y-3">
                        {/* Challenge Header */}
                        <div className="flex items-center gap-3 border-b border-gray-700 pb-2">
                          {challengeGroup.challengeImage && (
                            <img
                              src={challengeGroup.challengeImage}
                              alt={challengeGroup.challengeTitle}
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-sm">{challengeGroup.challengeTitle}</h3>
                            <p className="text-xs text-gray-400">
                              {challengeGroup.totalWins} Gewinn{challengeGroup.totalWins !== 1 ? 'e' : ''}
                              {challengeGroup.unreadWins > 0 && (
                                <span className="text-blue-400 ml-2">
                                  ({challengeGroup.unreadWins} neu)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {/* Wins for this challenge */}
                        <div className="space-y-2 ml-4">
                          {challengeGroup.wins.map((win) => (
                            <WinCard key={win.id} win={win} onMarkAsRead={markWinsAsRead} />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Show individual wins */
                    <div className="space-y-3">
                      {wins.map((win) => (
                        <WinCard key={win.id} win={win} onMarkAsRead={markWinsAsRead} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Individual Win Card Component
function WinCard({ win, onMarkAsRead }: { win: Win; onMarkAsRead: (winIds: string[]) => void }) {
  const getWinIcon = (winType: string) => {
    switch (winType) {
      case 'Winner':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'Reward':
        return <Gift className="w-5 h-5 text-green-400" />;
      case 'Achievement':
        return <Star className="w-5 h-5 text-purple-400" />;
      default:
        return <Trophy className="w-5 h-5 text-blue-400" />;
    }
  };

  const getWinBadgeColor = (winType: string) => {
    switch (winType) {
      case 'Winner':
        return 'bg-yellow-600 text-yellow-100';
      case 'Reward':
        return 'bg-green-600 text-green-100';
      case 'Achievement':
        return 'bg-purple-600 text-purple-100';
      default:
        return 'bg-blue-600 text-blue-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className={`p-4 rounded-lg border transition-colors ${
        win.isRead 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-750 border-blue-600 shadow-lg'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getWinIcon(win.winType)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWinBadgeColor(win.winType)}`}>
              {win.winType}
            </span>
            {!win.isRead && (
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            )}
            <span className="text-xs text-gray-400">
              {formatDate(win.createdAt)}
            </span>
          </div>
          
          <h4 className="font-semibold text-sm mb-1">{win.title}</h4>
          <p className="text-sm text-gray-300 mb-2">{win.message}</p>
          
          {/* Metadata display */}
          {win.metadata && (
            <div className="text-xs text-gray-400 mb-2">
              {win.metadata.prize && (
                <div className="flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  <span>Preis: {win.metadata.prize}</span>
                </div>
              )}
              {win.metadata.discountCode && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3" />
                  <span>Code: {win.metadata.discountCode}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            {!win.isRead && (
              <button
                onClick={() => onMarkAsRead([win.id])}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Als gelesen markieren
              </button>
            )}
            {win.isRead && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CheckCircle className="w-3 h-3" />
                <span>Gelesen</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}