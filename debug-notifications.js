// Debug script to check notification system
const { PrismaClient } = require('@prisma/client');

async function debugNotifications() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== 🔍 DEBUGGING NOTIFICATION SYSTEM ===');
    console.log('');
    
    // 1. Check Users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        whopUserId: true
      }
    });
    console.log('👥 USERS IN DATABASE:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Whop ID: ${user.whopUserId}`);
    });
    console.log('');
    
    // 2. Check Internal Notifications
    const notifications = await prisma.internalNotification.findMany({
      include: {
        user: { select: { name: true, email: true } },
        challenge: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('🔔 INTERNAL NOTIFICATIONS:', notifications.length);
    notifications.forEach(notif => {
      console.log(`  - ${notif.title} (${notif.type})`);
      console.log(`    User: ${notif.user.name} - Challenge: ${notif.challenge?.title || 'General'}`);
      console.log(`    Read: ${notif.isRead} - Created: ${notif.createdAt.toISOString().split('T')[0]}`);
    });
    console.log('');
    
    // 3. Check Winners
    const winners = await prisma.winner.findMany({
      include: {
        user: { select: { name: true, email: true } },
        challenge: { select: { title: true } }
      }
    });
    console.log('🏆 WINNERS IN DATABASE:', winners.length);
    winners.forEach(winner => {
      console.log(`  - ${winner.user.name} (Place ${winner.place}) - ${winner.challenge.title}`);
    });
    console.log('');
    
    if (notifications.length === 0) {
      console.log('❌ NO NOTIFICATIONS FOUND!');
      console.log('SOLUTION: Admin needs to save winners first!');
    } else {
      console.log('✅ NOTIFICATIONS EXIST - Check if user IDs match');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugNotifications();