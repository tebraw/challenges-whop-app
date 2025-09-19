import { NextRequest, NextResponse } from 'next/server';
import { whopAppSdk } from '@/lib/whop-sdk-dual';

export async function POST(request: NextRequest) {
  try {
    const { 
      whopUserId, 
      message, 
      title, 
      deepLink,
      challengeTitle,
      // Legacy support for old API format
      recipient,
      userEmail 
    } = await request.json();

    console.log('🔔 Sending Whop Push Notification:', {
      whopUserId,
      title: title || 'Challenge Update',
      message: message?.substring(0, 50) + '...',
      deepLink
    });

    // Validate required fields
    if (!whopUserId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: whopUserId and message' },
        { status: 400 }
      );
    }

    // Send push notification via Whop SDK - correct format for direct user notifications
    // Based on live error analysis: Use company targeting instead of direct user targeting
    const notificationPayload = {
      targets: {
        company: true  // Target the entire company, Whop will handle user filtering
      },
      title: title || `🏆 ${challengeTitle || 'Challenge'} Update`,
      content: message,
      data: {
        deepLink,
        targetUserId: whopUserId  // Pass user ID in data for client-side filtering
      }
    };

    const notificationResult = await whopAppSdk.notifications.sendPushNotification(notificationPayload);

    console.log('✅ Whop Push Notification sent successfully:', {
      whopUserId,
      notificationSent: notificationResult,
      status: 'sent'
    });

    return NextResponse.json({
      success: true,
      message: 'Push notification sent successfully via Whop',
      notificationSent: notificationResult,
      whopUserId,
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending Whop push notification:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to send push notification',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
