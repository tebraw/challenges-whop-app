// lib/emailNotifications.ts

// Simple email notification system for winner announcements
// This can be used as an alternative to Whop messaging until proper integration

export interface EmailNotification {
  to: string;
  subject: string;
  message: string;
  type?: 'winner' | 'general';
}

export async function sendEmailNotification(notification: EmailNotification): Promise<boolean> {
  try {
    // For now, log the email that would be sent
    console.log('📧 EMAIL NOTIFICATION:');
    console.log('To:', notification.to);
    console.log('Subject:', notification.subject);
    console.log('Message:', notification.message);
    console.log('Type:', notification.type || 'general');
    console.log('Timestamp:', new Date().toISOString());
    
    // TODO: Integrate with actual email service (SendGrid, Mailgun, etc.)
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: notification.to,
      from: 'noreply@yourdomain.com',
      subject: notification.subject,
      text: notification.message,
      html: `<p>${notification.message}</p>`,
    };
    
    await sgMail.send(msg);
    */
    
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

export function convertWhopNotificationToEmail(
  userEmail: string, 
  whopNotification: { userId: string; message: string; title?: string }
): EmailNotification {
  return {
    to: userEmail,
    subject: whopNotification.title || 'Winner Announcement',
    message: whopNotification.message,
    type: 'winner'
  };
}
