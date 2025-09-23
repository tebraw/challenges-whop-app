// lib/internalNotifications.ts

// Internal App Notification System
// For in-app notifications between Dashboard and Experience

export interface InternalNotification {
  userId: string;
  challengeId?: string;
  title: string;
  message: string;
  type?: 'winner_announcement' | 'challenge_update' | 'general';
  metadata?: Record<string, any>;
}

export async function sendInternalNotification(notification: InternalNotification): Promise<boolean> {
  try {
    console.log('📱 Creating internal notification directly in database:', {
      userId: notification.userId,
      challengeId: notification.challengeId,
      title: notification.title,
      type: notification.type
    });

    // Import Prisma client directly to avoid HTTP calls in production
    const { prisma } = await import('@/lib/prisma');

    // Create notification directly in database
    const createdNotification = await prisma.internalNotification.create({
      data: {
        userId: notification.userId,
        challengeId: notification.challengeId,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'winner_announcement',
        metadata: notification.metadata ? JSON.stringify(notification.metadata) : null,
        isRead: false,
        createdAt: new Date()
      }
    });

    console.log('✅ Internal notification created successfully in database:', {
      id: createdNotification.id,
      userId: createdNotification.userId,
      challengeId: createdNotification.challengeId,
      title: createdNotification.title,
      type: createdNotification.type,
      createdAt: createdNotification.createdAt.toISOString()
    });

    return true;

  } catch (error) {
    console.error('❌ Error creating internal notification in database:', error);
    return false;
  }
}

export async function fetchUserNotifications(userId: string, unreadOnly = false): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      userId,
      unreadOnly: unreadOnly.toString(),
      limit: '50'
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/internal/notifications?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`✅ Fetched ${result.notifications.length} notifications for user ${userId}`);
      return result.notifications;
    } else {
      console.error('❌ Failed to fetch notifications:', result.error);
      return [];
    }

  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/internal/notifications`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationId })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`✅ Marked notification ${notificationId} as read`);
      return true;
    } else {
      console.error('❌ Failed to mark notification as read:', result.error);
      return false;
    }

  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/internal/notifications`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId,
        markAllAsRead: true 
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`✅ Marked all notifications as read for user ${userId}`);
      return true;
    } else {
      console.error('❌ Failed to mark all notifications as read:', result.error);
      return false;
    }

  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return false;
  }
}

// Helper to create winner announcement notification
export function createWinnerNotification(
  userId: string, 
  challengeId: string, 
  challengeTitle: string, 
  place: number
): InternalNotification {
  const placeText = place === 1 ? '1st Place' : 
                   place === 2 ? '2nd Place' : 
                   place === 3 ? '3rd Place' : 
                   `${place}th Place`;

  return {
    userId,
    challengeId,
    title: `🏆 ${challengeTitle} - Winner Announcement`,
    message: `🎉 Congratulations! You won ${placeText} in the "${challengeTitle}" challenge!`,
    type: 'winner_announcement',
    metadata: {
      challengeId,
      challengeTitle,
      place,
      timestamp: new Date().toISOString()
    }
  };
}