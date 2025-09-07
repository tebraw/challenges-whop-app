import { NextRequest, NextResponse } from 'next/server';
import { sendWhopNotification, getWhopUserIdByEmail } from '@/lib/whopApi';
import { sendEmailNotification, convertWhopNotificationToEmail } from '@/lib/emailNotifications';

export async function POST(request: NextRequest) {
  try {
    const { recipient, userEmail, message, title, type } = await request.json();

    // Support both 'recipient' and 'userEmail' for backwards compatibility
    const email = recipient || userEmail;

    if (!email || !message) {
      return NextResponse.json(
        { error: 'User email and message are required' },
        { status: 400 }
      );
    }

    console.log('🔔 Processing notification request:');
    console.log('Email:', email);
    console.log('Title:', title);
    console.log('Message:', message);

    // Get Whop user ID from email
    const whopUserId = await getWhopUserIdByEmail(email);
    
    if (!whopUserId) {
      console.log('Could not find Whop user ID for email:', email);
    }

    // Prepare notification data
    const notificationData = {
      userId: whopUserId || `user_${email.replace('@', '_').replace('.', '_')}`,
      message,
      title: title || 'Winner Announcement'
    };

    // Send via Whop API (will log for manual processing)
    const whopSuccess = await sendWhopNotification(notificationData);

    // Also send as email notification
    const emailNotification = convertWhopNotificationToEmail(email, notificationData);
    const emailSuccess = await sendEmailNotification(emailNotification);

    // Determine overall success
    const success = whopSuccess && emailSuccess;

    if (success) {
      return NextResponse.json({ 
        message: 'Notification processed successfully',
        whopUserId: notificationData.userId,
        emailSent: emailSuccess,
        whopLogged: whopSuccess,
        type: type || 'general'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to process notification' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in Whop notification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
