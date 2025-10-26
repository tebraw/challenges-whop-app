'use client';

import { useState, useEffect } from 'react';
import { Trophy, Bell, Gift, CheckCircle, Clock } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  challengeId?: string;
  challengeTitle?: string;
  metadata?: any;
}

interface CompletedChallengesFeedProps {
  userId: string;
}

export default function CompletedChallengesFeed({ userId }: CompletedChallengesFeedProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!userId) return;
    
    try {
      const params = new URLSearchParams({
        userId,
        limit: '10'
      });

      const response = await fetch(`/api/internal/notifications?${params}`);
      const result = await response.json();

      if (result.success) {
        // Filter for winner announcements and challenge updates
        const relevantNotifications = result.notifications.filter((n: Notification) => 
          n.type === 'winner_announcement' || n.type === 'challenge_update'
        );
        setNotifications(relevantNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/internal/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'winner_announcement':
        return <Trophy className="h-6 w-6 text-yellow-400" />;
      case 'challenge_update':
        return <Gift className="h-6 w-6 text-blue-400" />;
      default:
        return <Bell className="h-6 w-6 text-gray-400" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Completed Challenges</h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-400 mt-3">Loading your achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Completed Challenges</h3>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={loadNotifications}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
          >
            <Clock className="h-4 w-4" />
            Refresh
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-gray-500" />
          </div>
          <h4 className="text-white font-medium mb-2">No achievements yet</h4>
          <p className="text-gray-400 text-sm">
            Complete challenges to see your achievements here!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative p-4 rounded-lg border transition-all cursor-pointer ${
                !notification.isRead 
                  ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50' 
                  : 'bg-gray-750 border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              {/* New notification indicator */}
              {!notification.isRead && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 p-2 bg-gray-700 rounded-lg">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-gray-300 text-sm mb-2 leading-relaxed">
                    {notification.message}
                  </p>
                  
                  {/* Challenge info and timestamp */}
                  <div className="flex items-center justify-between text-xs">
                    {notification.challengeTitle && (
                      <span className="text-gray-400 bg-gray-700 px-2 py-1 rounded">
                        {notification.challengeTitle}
                      </span>
                    )}
                    <span className="text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>

                  {/* Winner metadata */}
                  {notification.type === 'winner_announcement' && notification.metadata?.place && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Trophy className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {notification.metadata.place === 1 ? '🥇 1st Place' : 
                           notification.metadata.place === 2 ? '🥈 2nd Place' : 
                           notification.metadata.place === 3 ? '🥉 3rd Place' : 
                           `🏆 ${notification.metadata.place}th Place`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Read indicator */}
              {notification.isRead && (
                <div className="absolute bottom-2 right-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
              )}
            </div>
          ))}

          {/* Show more button if there are many notifications */}
          {notifications.length >= 10 && (
            <button
              onClick={loadNotifications}
              className="w-full py-3 text-center text-sm text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
            >
              Load more achievements
            </button>
          )}
        </div>
      )}
    </div>
  );
}
