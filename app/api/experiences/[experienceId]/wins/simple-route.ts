import { NextRequest, NextResponse } from 'next/server';
import { whopAppSdk } from '@/lib/whop-sdk-dual';
import { prisma } from '@/lib/prisma';

// EXACT SAME LOGIC AS NOTIFICATION BELL - just different display
export async function GET(request: NextRequest, { params }: { params: { experienceId: string } }) {
  try {
    console.log('🏆 Simple Wins API - Load same data as notification bell');
    
    // Get user from token (same as bell)
    const userData = await whopAppSdk.verifyUserToken(request);
    if (!userData?.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Find user in database (same as bell)
    const dbUser = await prisma.user.findFirst({
      where: { whopUserId: userData.userId }
    });

    if (!dbUser) {
      return NextResponse.json({ 
        success: true, 
        notifications: [],
        unreadCount: 0
      });
    }

    // EXACT SAME QUERY AS NotificationBadge.tsx
    const notifications = await prisma.internalNotification.findMany({
      where: {
        userId: dbUser.id
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate unread count (same as bell)
    const unreadCount = notifications.filter(n => !n.isRead).length;

    console.log(`🔔 Found ${notifications.length} notifications (${unreadCount} unread) - same as bell!`);

    return NextResponse.json({
      success: true,
      notifications: notifications,
      unreadCount: unreadCount,
      totalCount: notifications.length
    });

  } catch (error) {
    console.error('❌ Wins API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load notifications' },
      { status: 500 }
    );
  }
}