import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whopAppSdk } from '@/lib/whop-sdk-dual';

// API to fetch participant's wins/notifications for challenges in an experience
export async function GET(
  request: NextRequest,
  { params }: { params: { experienceId: string } }
) {
  console.log('=== 🏆 EXPERIENCE WINS API CALLED ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    const experienceId = params.experienceId;
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId'); // Optional: specific challenge
    
    // Verify user token and get user info
    const userData = await whopAppSdk.verifyUserToken(request);
    
    if (!userData.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const whopUserId = userData.userId;
    console.log('🔍 Fetching wins for user:', {
      whopUserId,
      experienceId,
      specificChallenge: challengeId
    });

    // Find the user in our database
    const dbUser = await prisma.user.findFirst({
      where: { whopUserId }
    });

    if (!dbUser) {
      console.log('❌ User not found in database:', whopUserId);
      return NextResponse.json({
        success: true,
        wins: [],
        message: 'No wins found - user not in database'
      });
    }

    // Fetch both wins and general notifications for this user
    console.log('🔍 Fetching wins and notifications for user:', dbUser.id);

    // 1. Build where clause for wins (specific types)
    const winsWhereClause: any = {
      userId: dbUser.id,
      type: {
        in: ['winner_announcement', 'reward_earned', 'achievement_unlocked']
      }
    };

    // 2. Build where clause for all notifications 
    const notificationsWhereClause: any = {
      userId: dbUser.id
    };

    // If specific challenge requested, filter by challenge
    if (challengeId) {
      winsWhereClause.challengeId = challengeId;
      notificationsWhereClause.challengeId = challengeId;
    } else {
      // Filter by experience - get all challenges in this experience
      const experienceChallenges = await prisma.challenge.findMany({
        where: { experienceId },
        select: { id: true }
      });
      
      if (experienceChallenges.length > 0) {
        const challengeIds = experienceChallenges.map(c => c.id);
        winsWhereClause.challengeId = { in: challengeIds };
        // For notifications, include both challenge-specific and general notifications
        notificationsWhereClause.OR = [
          { challengeId: { in: challengeIds } },
          { challengeId: null } // General notifications without challenge
        ];
      }
    }

    // Fetch wins (specific achievement types)
    const wins = await prisma.internalNotification.findMany({
      where: winsWhereClause,
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            experienceId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch all notifications (including wins but also general notifications)
    const allNotifications = await prisma.internalNotification.findMany({
      where: notificationsWhereClause,
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            experienceId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${wins.length} wins and ${allNotifications.length} total notifications for user`);

    // Format wins for frontend (achievement-specific items)
    const formattedWins = wins.map(win => ({
      id: win.id,
      title: win.title,
      message: win.message,
      type: win.type,
      isRead: win.isRead,
      createdAt: win.createdAt.toISOString(),
      challengeId: win.challengeId,
      challengeTitle: win.challenge?.title,
      challengeImage: win.challenge?.imageUrl,
      metadata: win.metadata ? JSON.parse(win.metadata) : null,
      // Determine win type for display
      winType: win.type === 'winner_announcement' ? 'Winner' : 
               win.type === 'reward_earned' ? 'Reward' : 
               win.type === 'achievement_unlocked' ? 'Achievement' : 'Prize',
      category: 'win' // Mark as win
    }));

    // Format all notifications for frontend (including general notifications)
    const formattedNotifications = allNotifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      challengeId: notification.challengeId,
      challengeTitle: notification.challenge?.title,
      challengeImage: notification.challenge?.imageUrl,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
      // Determine display type
      winType: notification.type === 'winner_announcement' ? 'Winner' : 
               notification.type === 'reward_earned' ? 'Reward' : 
               notification.type === 'achievement_unlocked' ? 'Achievement' :
               notification.type === 'challenge_update' ? 'Update' :
               'Notification',
      category: ['winner_announcement', 'reward_earned', 'achievement_unlocked'].includes(notification.type) ? 'win' : 'notification'
    }));

    // Group all items by challenge for better organization
    const itemsByChallenge = formattedNotifications.reduce((acc, item) => {
      const challengeId = item.challengeId || 'general';
      if (!acc[challengeId]) {
        acc[challengeId] = {
          challengeId: challengeId === 'general' ? null : challengeId,
          challengeTitle: challengeId === 'general' ? 'Allgemeine Benachrichtigungen' : item.challengeTitle,
          challengeImage: item.challengeImage,
          wins: [],
          notifications: [],
          totalWins: 0,
          totalNotifications: 0,
          unreadWins: 0,
          unreadNotifications: 0
        };
      }
      
      if (item.category === 'win') {
        acc[challengeId].wins.push(item);
        acc[challengeId].totalWins++;
        if (!item.isRead) acc[challengeId].unreadWins++;
      } else {
        acc[challengeId].notifications.push(item);
        acc[challengeId].totalNotifications++;
        if (!item.isRead) acc[challengeId].unreadNotifications++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      wins: formattedWins, // Only actual wins (achievements)
      notifications: formattedNotifications, // All notifications including wins
      winsByChallenge: Object.values(itemsByChallenge), // Grouped by challenge
      totalWins: formattedWins.length,
      totalNotifications: formattedNotifications.length,
      unreadWins: formattedWins.filter(w => !w.isRead).length,
      unreadNotifications: formattedNotifications.filter(n => !n.isRead).length,
      experienceId
    });

  } catch (error) {
    console.error('❌ Error fetching experience wins:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch wins',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH: Mark wins as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { experienceId: string } }
) {
  try {
    const requestBody = await request.json();
    const { winIds, markAllAsRead, challengeId } = requestBody;
    
    // Verify user token
    const userData = await whopAppSdk.verifyUserToken(request);
    
    if (!userData.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const whopUserId = userData.userId;
    const dbUser = await prisma.user.findFirst({
      where: { whopUserId }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (markAllAsRead) {
      // Mark all notifications as read for this experience (both wins and general)
      const experienceChallenges = await prisma.challenge.findMany({
        where: { experienceId: params.experienceId },
        select: { id: true }
      });

      const whereClause: any = {
        userId: dbUser.id,
        isRead: false
      };

      if (challengeId) {
        whereClause.challengeId = challengeId;
      } else {
        const challengeIds = experienceChallenges.map(c => c.id);
        whereClause.OR = [
          { challengeId: { in: challengeIds } },
          { challengeId: null } // Also mark general notifications
        ];
      }

      await prisma.internalNotification.updateMany({
        where: whereClause,
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      console.log('✅ Marked all wins and notifications as read for experience');
    } else if (winIds && winIds.length > 0) {
      // Mark specific wins as read
      await prisma.internalNotification.updateMany({
        where: {
          id: { in: winIds },
          userId: dbUser.id
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      console.log(`✅ Marked ${winIds.length} notifications as read`);
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (error) {
    console.error('❌ Error marking notifications as read:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to mark notifications as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}