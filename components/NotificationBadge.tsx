'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trophy, Gift, Copy, CheckCircle, ExternalLink } from 'lucide-react';

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
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Function to make links clickable in notification messages
  const renderMessageWithLinks = (message: string) => {
    if (!message) return null;
    
    // Enhanced regex to detect more URL formats
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
    const parts = message.split(urlRegex);
    
    return parts.map((part, index) => {
      // Test if this part is a URL
      if (part.match(urlRegex)) {
        // Clean URL - remove trailing punctuation that might not be part of URL
        const cleanUrl = part.replace(/[.,;!?]+$/, '');
        return (
          <a
            key={index}
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all inline-flex items-center gap-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔗 Notification link clicked:', cleanUrl);
            }}
          >
            {cleanUrl}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
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

  // Handle click outside to close panel - Enhanced for iFrame compatibility
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log('Click detected outside check', {
        panelExists: !!panelRef.current,
        target: event.target,
        showPanel
      });
      
      if (panelRef.current && event.target && !panelRef.current.contains(event.target as Node)) {
        console.log('Click outside panel detected, closing panel');
        setShowPanel(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPanel) {
        console.log('Escape key pressed, closing panel');
        setShowPanel(false);
      }
    };

    if (showPanel) {
      console.log('Adding click outside and escape listeners for panel');
      // Use both document and window for better iFrame compatibility
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('keydown', handleEscapeKey);
      window.addEventListener('mousedown', handleClickOutside, true);
      
      return () => {
        console.log('Removing click outside and escape listeners for panel');
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('keydown', handleEscapeKey);
        window.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [showPanel]);

  // Handle escape key and click outside for modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDetailModal) {
        console.log('Escape key pressed, closing modal');
        setShowDetailModal(false);
      }
    };

    if (showDetailModal) {
      console.log('Adding escape key listener for modal');
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        console.log('Removing escape key listener for modal');
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showDetailModal]);

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
        <div 
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 sm:w-96 sm:right-0 max-sm:-right-2 max-sm:w-[calc(100vw-3rem)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white text-lg sm:text-base">Notifications</h3>
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
                    className={`p-3 sm:p-4 hover:bg-gray-750 transition-colors cursor-pointer ${
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
                        <div className="text-gray-300 text-sm mb-2 leading-relaxed line-clamp-2">
                          {renderMessageWithLinks(notification.message)}
                        </div>
                        
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

      {/* Notification Detail Modal - Enhanced iFrame compatibility */}
      {showDetailModal && selectedNotification && (
        <div 
          className="fixed z-[9999] bg-black/50 backdrop-blur-sm"
          style={{ 
            position: 'fixed',
            top: '0px',
            left: '0px',
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onMouseDown={(e) => {
            console.log('Modal backdrop mousedown', { 
              target: e.target, 
              currentTarget: e.currentTarget,
              isBackdrop: e.target === e.currentTarget 
            });
            if (e.target === e.currentTarget) {
              console.log('Closing modal due to backdrop mousedown');
              setShowDetailModal(false);
            }
          }}
          onClick={(e) => {
            console.log('Modal backdrop clicked', e.target, e.currentTarget);
            if (e.target === e.currentTarget) {
              console.log('Closing modal due to backdrop click');
              setShowDetailModal(false);
            }
          }}
        >
          <div 
            className="bg-gray-800 rounded-2xl shadow-2xl relative"
            style={{
              maxWidth: '32rem',
              width: '100%',
              maxHeight: 'calc(100vh - 2rem)',
              overflowY: 'auto',
              transform: 'translate(0, 0)'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                {getNotificationIcon(selectedNotification.type)}
                <h2 className="text-lg sm:text-xl font-bold text-white">Notification Details</h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedNotification.title}
              </h3>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {renderMessageWithLinks(selectedNotification.message)}
                </div>
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