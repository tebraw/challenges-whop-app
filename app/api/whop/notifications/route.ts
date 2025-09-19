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

    // Send push notification via Whop SDK with correct format
    // Based on official Whop SDK - use userIds directly, not targets
    const notificationPayload = {
      userIds: [whopUserId],  // Direct user IDs array (not targets)
      title: title || `🏆 ${challengeTitle || 'Challenge'} Update`,
      content: message  // Use 'content' as required by SendNotificationInput
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
