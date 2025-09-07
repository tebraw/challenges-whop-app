import { NextRequest, NextResponse } from 'next/server';
import { sendWhopNotification, getWhopUserIdByEmail } from '@/lib/whopApi';

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

    // Get Whop user ID from email
    const whopUserId = await getWhopUserIdByEmail(email);
    
    if (!whopUserId) {
      console.error('Could not find Whop user ID for email:', email);
      // For development, we'll still proceed with a mock ID
    }

    // Send notification via Whop
    const success = await sendWhopNotification({
      userId: whopUserId || `mock_${email}`,
      message,
      title: title || 'Winner Announcement'
    });

    if (success) {
      return NextResponse.json({ 
        message: 'Notification sent successfully',
        whopUserId: whopUserId || `mock_${email}`,
        type: type || 'general'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification' },
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
