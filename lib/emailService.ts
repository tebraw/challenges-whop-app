import nodemailer from 'nodemailer';

// Email configuration - you'll need to set these environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
});

export interface WinnerNotification {
  userName: string;
  userEmail: string;
  challengeTitle: string;
  place: number;
  challengeId: string;
}

export async function sendWinnerNotification(winner: WinnerNotification): Promise<boolean> {
  try {
    const placeEmoji = getPlaceEmoji(winner.place);
    const placeText = getPlaceText(winner.place);
    
    const mailOptions = {
      from: `"Challenge Platform" <${process.env.SMTP_USER || 'noreply@example.com'}>`,
      to: winner.userEmail,
      subject: `🎉 Congratulations! You won ${placeText} in "${winner.challengeTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Congratulations!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .trophy { font-size: 64px; margin: 20px 0; }
            .place { font-size: 24px; font-weight: bold; margin: 10px 0; }
            .challenge-title { color: #667eea; font-size: 20px; margin: 15px 0; }
            .cta { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="trophy">${placeEmoji}</div>
              <h1>Congratulations, ${winner.userName}!</h1>
              <div class="place">You achieved ${placeText}!</div>
            </div>
            <div class="content">
              <p>We are thrilled to announce that you have won <strong>${placeText}</strong> in the challenge:</p>
              <div class="challenge-title">"${winner.challengeTitle}"</div>
              
              <p>Your dedication and consistency throughout this challenge have paid off. You should be proud of your achievement!</p>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>🏆 Your victory has been recorded</li>
                <li>🎁 Check for any special rewards or offers</li>
                <li>📈 Your progress has been saved to your profile</li>
                <li>🌟 You've earned this achievement forever</li>
              </ul>
              
              <p>Keep up the great work and stay tuned for more exciting challenges!</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/c/${winner.challengeId}" class="cta">
                View Challenge Results
              </a>
            </div>
            <div class="footer">
              <p>Thanks for participating in our challenges!<br>
              Challenge Platform Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Congratulations, ${winner.userName}!

You achieved ${placeText} in "${winner.challengeTitle}"!

Your dedication and consistency throughout this challenge have paid off. You should be proud of your achievement!

What happens next:
- Your victory has been recorded
- Check for any special rewards or offers  
- Your progress has been saved to your profile
- You've earned this achievement forever

Keep up the great work and stay tuned for more exciting challenges!

View your results: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/c/${winner.challengeId}

Thanks for participating!
Challenge Platform Team
      `
    };

    // In development/testing, just log instead of actually sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Winner notification email (DEV MODE):');
      console.log('To:', winner.userEmail);
      console.log('Subject:', mailOptions.subject);
      console.log('Winner:', winner.userName, `(${placeText})`);
      console.log('Challenge:', winner.challengeTitle);
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Winner notification sent:', info.messageId);
    return true;

  } catch (error) {
    console.error('Failed to send winner notification:', error);
    return false;
  }
}

function getPlaceEmoji(place: number): string {
  switch (place) {
    case 1: return '🥇';
    case 2: return '🥈'; 
    case 3: return '🥉';
    default: return '🏆';
  }
}

function getPlaceText(place: number): string {
  switch (place) {
    case 1: return '1st Place';
    case 2: return '2nd Place';
    case 3: return '3rd Place';
    default: return `${place}th Place`;
  }
}

// Test function for development
export async function testEmail() {
  const testWinner: WinnerNotification = {
    userName: 'Test User',
    userEmail: 'test@example.com',
    challengeTitle: 'Test Challenge',
    place: 1,
    challengeId: 'test-challenge-id'
  };
  
  return await sendWinnerNotification(testWinner);
}
