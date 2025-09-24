'use client';

import { useState, useEffect } from 'react';
import { Trophy, Gift, Star, CheckCircle, Clock, X, ExternalLink, Bell, RefreshCw } from 'lucide-react';

interface Win {
  id: string;
  title: string;
  message: string;
  type: string;
  winType: string;
  description?: string;
  isRead: boolean;
  createdAt: string;
  challengeId: string;
  challengeTitle: string;
  challengeImage?: string;
  metadata?: any;
  category: 'win' | 'notification';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  winType: string;
  isRead: boolean;
  createdAt: string;
  challengeId?: string;
  challengeTitle?: string;
  challengeImage?: string;
  metadata?: any;
  category: 'win' | 'notification';
}

interface WinsByChallenge {
  challengeId: string | null;
  challengeTitle: string;
  challengeImage?: string;
  wins: Win[];
  notifications: Notification[];
  totalWins: number;
  totalNotifications: number;
  unreadWins: number;
  unreadNotifications: number;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [winsByChallenge, setWinsByChallenge] = useState<WinsByChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalWins, setTotalWins] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadWins, setUnreadWins] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'wins' | 'notifications'>('all');

  useEffect(() => {
    if (isOpen && experienceId) {
      fetchWins();
    }
  }, [isOpen, experienceId, challengeId]);

  const fetchWins = async () => {
    setLoading(true);
    try {
      // SAME API CALL AS NOTIFICATION BELL - just different display
      const response = await fetch(`/api/experiences/${experienceId}/wins`);
      const data = await response.json();

      if (data.success) {
        // All notifications from bell become our data
        setNotifications(data.notifications || []);
        setTotalNotifications(data.totalCount || 0);
        setUnreadNotifications(data.unreadCount || 0);
        
        // Group by challenge for display
        const grouped = (data.notifications || []).reduce((acc: any, notification: any) => {
          const challengeTitle = notification.challenge?.title || 'Allgemeine Benachrichtigungen';
          if (!acc[challengeTitle]) {
            acc[challengeTitle] = { wins: [], notifications: [] };
          }
          acc[challengeTitle].notifications.push(notification);
          return acc;
        }, {});
        
        setWinsByChallenge(grouped);
        console.log('🎉 Loaded same data as notification bell:', data.notifications?.length, 'items');
      } else {
        console.error('Failed to fetch wins:', data.error);
      }
    } catch (error) {
      console.error('Error fetching wins:', error);
    } finally {
      setLoading(false);
    }
  };

  const markWinsAsRead = async (winIds?: string[] | string, markAllAsRead = false) => {
    try {
      // Convert single winId to array
      const idsArray = typeof winIds === 'string' ? [winIds] : winIds;
      
      const response = await fetch(`/api/experiences/${experienceId}/wins`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winIds: idsArray,
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

  // Utility Functions
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      return 'a few minutes ago';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} days ago`;
    } else {
      return date.toLocaleDateString('en-US');
    }
  };

  const formatWinType = (type: string) => {
    switch (type) {
      case 'Winner':
        return 'Winner';
      case 'Reward':
        return 'Reward';
      case 'Achievement':
        return 'Achievement';
      default:
        return type;
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/internal-notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
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

  // Function to make links clickable in notification messages
  const renderMessageWithLinks = (message: string) => {
    // Regular expression to detect URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        );
      }
      return <span key={index}>{part}</span>;
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
                    {challengeId ? `Wins & Notifications: ${challengeTitle}` : 'My Wins & Notifications'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {(unreadWins > 0 || unreadNotifications > 0) && (
                    <button
                      onClick={() => markWinsAsRead(undefined, true)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                    >
                      Mark all as read
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
              
              {/* Summary Stats & Tabs */}
              <div className="mt-4">
                <div className="flex gap-4 text-sm text-gray-400 mb-3">
                  <span>🔔 Notifications: {totalNotifications} {unreadNotifications > 0 && `(${unreadNotifications} new)`}</span>
                </div>
              </div>
            </div>

            {/* Content - Same data as notification bell, just prettier display */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        notification.isRead
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-blue-900/30 border-blue-600 shadow-lg'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {notification.type === 'winner_announcement' ? (
                              <Trophy className="w-5 h-5 text-yellow-400" />
                            ) : notification.type === 'challenge_update' ? (
                              <RefreshCw className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Bell className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-300">
                              {notification.type === 'winner_announcement' 
                                ? '🏆 Winner Announcement'
                                : notification.type === 'challenge_update'
                                ? '📋 Challenge Update'
                                : '🔔 Notification'
                              }
                            </span>
                            {!notification.isRead && (
                              <span className="bg-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                                NEU
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-white mb-2 text-lg">
                            {notification.title}
                          </h4>
                          <div className="text-gray-300 mb-3 leading-relaxed">
                            {renderMessageWithLinks(notification.message)}
                          </div>
                          {notification.challengeTitle && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                                {notification.challengeTitle}
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(new Date(notification.createdAt))}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors flex-shrink-0"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Keine Benachrichtigungen</h3>
                  <p className="text-sm">
                    When you participate in challenges or achieve milestones, your notifications will appear here.
                  </p>
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

  // Function to make links clickable in win messages
  const renderMessageWithLinks = (message: string) => {
    // Regular expression to detect URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        );
      }
      return <span key={index}>{part}</span>;
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
          <div className="text-sm text-gray-300 mb-2">
            {renderMessageWithLinks(win.message)}
          </div>
          
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
                Mark as read
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