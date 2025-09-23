import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk-dual';

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
    const headers = Object.fromEntries(request.headers.entries());
    const userData = await whopSdk.verifyUserToken(headers);
    
    if (!userData.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const whopUserId = userData.user.id;
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

    // Build where clause for notifications
    const whereClause: any = {
      userId: dbUser.id,
      type: {
        in: ['winner_announcement', 'reward_earned', 'achievement_unlocked']
      }
    };

    // If specific challenge requested, filter by challenge
    if (challengeId) {
      whereClause.challengeId = challengeId;
    } else {
      // Filter by experience - get all challenges in this experience
      const experienceChallenges = await prisma.challenge.findMany({
        where: { experienceId },
        select: { id: true }
      });
      
      if (experienceChallenges.length > 0) {
        whereClause.challengeId = {
          in: experienceChallenges.map(c => c.id)
        };
      }
    }

    // Fetch wins/notifications
    const wins = await prisma.internalNotification.findMany({
      where: whereClause,
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

    console.log(`✅ Found ${wins.length} wins for user in experience`);

    // Format wins for frontend
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
               win.type === 'achievement_unlocked' ? 'Achievement' : 'Prize'
    }));

    // Group wins by challenge for better organization
    const winsByChallenge = formattedWins.reduce((acc, win) => {
      const challengeId = win.challengeId;
      if (!acc[challengeId]) {
        acc[challengeId] = {
          challengeId,
          challengeTitle: win.challengeTitle,
          challengeImage: win.challengeImage,
          wins: [],
          totalWins: 0,
          unreadWins: 0
        };
      }
      acc[challengeId].wins.push(win);
      acc[challengeId].totalWins++;
      if (!win.isRead) {
        acc[challengeId].unreadWins++;
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      wins: formattedWins,
      winsByChallenge: Object.values(winsByChallenge),
      totalWins: formattedWins.length,
      unreadWins: formattedWins.filter(w => !w.isRead).length,
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
    const headers = Object.fromEntries(request.headers.entries());
    const userData = await whopSdk.verifyUserToken(headers);
    
    if (!userData.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const whopUserId = userData.user.id;
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
      // Mark all wins as read for this experience
      const experienceChallenges = await prisma.challenge.findMany({
        where: { experienceId: params.experienceId },
        select: { id: true }
      });

      const whereClause: any = {
        userId: dbUser.id,
        isRead: false,
        type: {
          in: ['winner_announcement', 'reward_earned', 'achievement_unlocked']
        }
      };

      if (challengeId) {
        whereClause.challengeId = challengeId;
      } else {
        whereClause.challengeId = {
          in: experienceChallenges.map(c => c.id)
        };
      }

      await prisma.internalNotification.updateMany({
        where: whereClause,
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      console.log('✅ Marked all wins as read for experience');
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

      console.log(`✅ Marked ${winIds.length} wins as read`);
    }

    return NextResponse.json({
      success: true,
      message: 'Wins marked as read'
    });

  } catch (error) {
    console.error('❌ Error marking wins as read:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to mark wins as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}