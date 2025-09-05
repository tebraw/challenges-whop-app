import { NextRequest, NextResponse } from 'next/server';
import { sendWhopNotification, getWhopUserIdByEmail } from '@/lib/whopApi';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, message, title } = await request.json();

    if (!userEmail || !message) {
      return NextResponse.json(
        { error: 'User email and message are required' },
        { status: 400 }
      );
    }

    // Get Whop user ID from email
    const whopUserId = await getWhopUserIdByEmail(userEmail);
    
    if (!whopUserId) {
      console.error('Could not find Whop user ID for email:', userEmail);
      // For development, we'll still proceed with a mock ID
    }

    // Send notification via Whop
    const success = await sendWhopNotification({
      userId: whopUserId || `mock_${userEmail}`,
      message,
      title
    });

    if (success) {
      return NextResponse.json({ 
        message: 'Notification sent successfully',
        whopUserId: whopUserId || `mock_${userEmail}`
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
