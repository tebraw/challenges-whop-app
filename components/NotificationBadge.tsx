'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, Trophy, Gift, Copy, CheckCircle } from 'lucide-react';

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

interface NotificationBadgeProps {
  userId: string;
  className?: string;
}

export default function NotificationBadge({ userId, className = '' }: NotificationBadgeProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId,
        limit: '20'
      });

      const response = await fetch(`/api/internal/notifications?${params}`);
      const result = await response.json();

      if (result.success) {
        setNotifications(result.notifications);
        setUnreadCount(result.notifications.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
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
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/internal/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, markAllAsRead: true })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'winner_announcement':
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 'challenge_update':
        return <Gift className="h-5 w-5 text-blue-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  // Format time ago
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

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    setShowPanel(false);
    
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  // Copy notification text
  const copyNotificationText = async () => {
    if (!selectedNotification) return;
    
    const textToCopy = `${selectedNotification.title}\n\n${selectedNotification.message}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [userId]);

  // Refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => {
          setShowPanel(!showPanel);
          if (!showPanel) loadNotifications();
        }}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">You'll see updates here when you complete challenges!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-750 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-gray-300 text-sm mb-2 leading-relaxed line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {/* Challenge info */}
                        {notification.challengeTitle && (
                          <p className="text-xs text-gray-400 mb-2">
                            Challenge: {notification.challengeTitle}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          
                          {!notification.isRead && (
                            <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700 text-center">
              <button
                onClick={loadNotifications}
                className="text-sm text-gray-400 hover:text-white"
              >
                Refresh notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notification Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl max-w-lg w-full mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                {getNotificationIcon(selectedNotification.type)}
                <h2 className="text-xl font-bold text-white">Notification Details</h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedNotification.title}
              </h3>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>

              {selectedNotification.challengeTitle && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400">
                    <span className="font-medium">Challenge:</span> {selectedNotification.challengeTitle}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  {formatTimeAgo(selectedNotification.createdAt)}
                </p>
              </div>

              {/* Copy Button */}
              <button
                onClick={copyNotificationText}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Copied to clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Copy notification text
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}