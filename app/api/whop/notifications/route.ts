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

    // Get Company ID from headers (Dashboard App context)
    const companyId = request.headers.get('X-Whop-Company-ID');
    
    console.log('🔍 Notification Debug - Headers:', {
      'X-Whop-Company-ID': companyId,
      'user-agent': request.headers.get('user-agent'),
      'origin': request.headers.get('origin'),
      allHeaders: Object.fromEntries(request.headers.entries())
    });

    if (!companyId) {
      console.error('❌ Missing X-Whop-Company-ID header - Dashboard App required');
      console.log('📋 Available headers:', Object.fromEntries(request.headers.entries()));
      return NextResponse.json(
        { 
          error: 'Company ID required for notifications',
          debug: 'Missing X-Whop-Company-ID header - ensure calling from Dashboard App context',
          availableHeaders: Object.fromEntries(request.headers.entries())
        },
        { status: 400 }
      );
    }

    console.log('🏢 Company ID detected:', companyId);

    // Send push notification via Whop SDK - correct Dashboard App format
    const notificationPayload = {
      companyTeamId: companyId,  // ← This is the key for Dashboard Apps!
      title: title || `🏆 ${challengeTitle || 'Challenge'} Update`,
      content: message,
      userIds: [whopUserId],  // Target specific user within company
      data: {
        deepLink,
        targetUserId: whopUserId,
        companyId: companyId  // Include for client filtering
      }
    };

    console.log('📡 Sending via SDK with companyTeamId:', notificationPayload);

    // Use the correct SDK method name
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
