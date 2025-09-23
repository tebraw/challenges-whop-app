import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Internal App Notification System
// Dashboard Winners → Experience Member Feed

export async function POST(request: NextRequest) {
  console.log('=== 📱 INTERNAL NOTIFICATION API CALLED ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    const requestBody = await request.json();
    console.log('📨 Internal Notification Request:', JSON.stringify(requestBody, null, 2));
    
    const { 
      userId, 
      challengeId,
      title, 
      message, 
      type,
      metadata 
    } = requestBody;

    // Validate required fields
    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and message' },
        { status: 400 }
      );
    }

    console.log('💾 Creating internal notification:', {
      userId,
      challengeId,
      title: title?.substring(0, 50) + '...',
      type,
      hasMetadata: !!metadata
    });

    // Create internal notification in database
    const notification = await prisma.internalNotification.create({
      data: {
        userId,
        challengeId,
        title: title || 'Challenge Update',
        message,
        type: type || 'winner_announcement',
        metadata: metadata ? JSON.stringify(metadata) : null,
        isRead: false,
        createdAt: new Date()
      }
    });

    console.log('✅ Internal notification created successfully:', {
      id: notification.id,
      userId: notification.userId,
      challengeId: notification.challengeId,
      title: notification.title,
      type: notification.type
    });

    return NextResponse.json({
      success: true,
      message: 'Internal notification created successfully',
      notificationId: notification.id,
      sentAt: notification.createdAt.toISOString()
    });

  } catch (error) {
    console.error('❌ Error creating internal notification:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to create internal notification',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

// GET: Fetch notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    console.log('📥 Fetching notifications for user:', {
      userId,
      unreadOnly,
      limit
    });

    const notifications = await prisma.internalNotification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {})
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            experienceId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    console.log(`✅ Found ${notifications.length} notifications for user ${userId}`);

    return NextResponse.json({
      success: true,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        challengeId: n.challengeId,
        challengeTitle: n.challenge?.title,
        metadata: n.metadata ? JSON.parse(n.metadata) : null
      })),
      unreadCount: notifications.filter(n => !n.isRead).length
    });

  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH: Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { notificationId, userId, markAllAsRead } = requestBody;

    if (markAllAsRead && userId) {
      // Mark all notifications as read for user
      await prisma.internalNotification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      console.log(`✅ Marked all notifications as read for user ${userId}`);

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } else if (notificationId) {
      // Mark specific notification as read
      const notification = await prisma.internalNotification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      console.log(`✅ Marked notification ${notificationId} as read`);

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
        notification: {
          id: notification.id,
          isRead: notification.isRead,
          readAt: notification.readAt?.toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or userId with markAllAsRead required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Error updating notification:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to update notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}