// force-colleague-admin-check.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceColleagueAdminCheck() {
  try {
    console.log('🔍 CHECKING COLLEAGUE ADMIN STATUS');
    console.log('==================================');
    
    const companyId = '9nmw5yleoqldrxf7n48c';
    const whopUserId = 'user_w3lVukX5x9ayO';
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        whopCompanyId: companyId,
        whopUserId: whopUserId
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('1. CURRENT STATUS:');
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🎭 Role: ${user.role}`);
    console.log(`   🔄 Subscription: ${user.subscriptionStatus}`);
    console.log(`   🎯 Tier: ${user.tier}`);
    
    // Check if user needs admin upgrade
    if (user.role === 'USER' && user.whopCompanyId) {
      console.log('\n2. UPGRADING TO ADMIN:');
      console.log('   🎯 User is company owner but not admin');
      console.log('   🔄 Forcing admin upgrade...');
      
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'ADMIN',
          subscriptionStatus: 'active',
          tier: 'enterprise',
          isFreeTier: false
        }
      });
      
      console.log('   ✅ UPGRADED TO ADMIN!');
      console.log(`   📧 User: ${updatedUser.email}`);
      console.log(`   🎭 Role: USER → ADMIN`);
      console.log(`   🔄 Status: free → active`);
      console.log(`   🎯 Tier: free → enterprise`);
      
      console.log('\n3. VERIFICATION:');
      console.log('   ✅ User should now have admin access');
      console.log('   🔑 Can access /admin routes');
      console.log('   📊 Can create and manage challenges');
      
    } else if (user.role === 'ADMIN') {
      console.log('\n2. STATUS:');
      console.log('   ✅ User is already ADMIN');
      console.log('   🎉 No action needed');
    } else {
      console.log('\n2. ISSUE:');
      console.log('   ❌ User has no company ID');
      console.log('   💡 Cannot grant admin access');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceColleagueAdminCheck();