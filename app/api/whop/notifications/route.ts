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

    // Enhanced Company ID detection from multiple sources
    const headers = Object.fromEntries(request.headers.entries());
    const companyIdFromHeader = request.headers.get('X-Whop-Company-ID') || request.headers.get('x-whop-company-id');
    
    // Extract Company ID from referer URL (Dashboard App pattern)
    const referer = request.headers.get('referer') || '';
    const companyIdFromUrl = referer.match(/\/dashboard\/([^\/]+)/)?.[1];
    
    // Extract from origin if Dashboard App
    const origin = request.headers.get('origin') || '';
    const isFromDashboardApp = origin.includes('.apps.whop.com');
    
    const companyId = companyIdFromHeader || companyIdFromUrl;
    
    console.log('🔍 ENHANCED Company ID Detection:', {
      'Header X-Whop-Company-ID': companyIdFromHeader,
      'URL Company ID': companyIdFromUrl,
      'Final Company ID': companyId,
      'Referer': referer,
      'Origin': origin,
      'Is Dashboard App': isFromDashboardApp,
      'All headers': headers
    });

    if (!companyId) {
      console.error('❌ No Company ID found in headers OR URL');
      console.log('📋 Available headers:', headers);
      return NextResponse.json(
        { 
          error: 'Company ID required for notifications',
          debug: {
            message: 'No Company ID found in X-Whop-Company-ID header or dashboard URL',
            referer: referer,
            origin: origin,
            isDashboardApp: isFromDashboardApp,
            suggestion: 'Ensure calling from Dashboard App with company context'
          },
          availableHeaders: headers
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
      userIds: [whopUserId]  // Target specific user within company
      // Note: Removed 'data' field as it's not supported by SendNotificationInput
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
