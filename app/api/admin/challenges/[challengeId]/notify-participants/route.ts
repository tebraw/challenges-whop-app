import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendInternalNotification } from '@/lib/internalNotifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { challengeId: string } }
) {
  try {
    const { challengeId } = params;
    const { title, message } = await request.json();

    // Validate input
    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Get challenge with participants
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        enrollments: {
          include: {
            user: true
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Create notifications for all participants
    const notifications = [];
    for (const enrollment of challenge.enrollments) {
      try {
        const notification = await sendInternalNotification({
          userId: enrollment.user.id,
          type: 'challenge_update',
          title: title.trim(),
          message: message.trim(),
          challengeId: challengeId,
          metadata: {
            source: 'admin_broadcast',
            challengeId: challengeId,
            challengeTitle: challenge.title,
            sentBy: 'admin'
          }
        });
        notifications.push(notification);
      } catch (error) {
        console.error(`Failed to create notification for user ${enrollment.user.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      count: notifications.length,
      message: `Successfully sent notifications to ${notifications.length} participants`
    });

  } catch (error) {
    console.error('Error sending notifications to participants:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}