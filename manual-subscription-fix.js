// manual-subscription-fix.js
// Script to manually check and fix subscription status

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserSubscription() {
  try {
    console.log('🔧 Manual subscription fix starting...\n');
    
    // Find users who might need admin access
    const users = await prisma.user.findMany({
      where: {
        role: 'USER'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`📊 Found ${users.length} users that might need admin access:`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Whop User ID: ${user.whopUserId || 'None'}`);
      console.log(`   Whop Company ID: ${user.whopCompanyId || 'None'}`);
      console.log(`   Created: ${user.createdAt}`);
      
      // Check if user has company owner role (should be admin)
      if (user.whopCompanyId) {
        console.log(`   🎯 User has company ID - should be admin!`);
        
        // Update to admin
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' }
        });
        
        console.log(`   ✅ Updated user to ADMIN role`);
      }
    }
    
    // Also check for recent users who paid
    console.log('\n💰 Checking for users who likely paid recently...');
    
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📅 Found ${recentUsers.length} users created in last 24 hours:`);
    
    for (const user of recentUsers) {
      console.log(`\n🆕 Recent user: ${user.email}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Whop Company ID: ${user.whopCompanyId || 'None'}`);
      
      if (user.whopCompanyId && user.role !== 'ADMIN') {
        console.log(`    🚀 Promoting to admin...`);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' }
        });
        
        console.log(`    ✅ Promoted to ADMIN`);
      }
    }
    
    console.log('\n🎉 Subscription fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserSubscription();