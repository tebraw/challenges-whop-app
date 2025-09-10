// cleanup-test-users.js - Clean up test users for fresh Whop testing
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupTestUsers() {
  try {
    console.log('🔍 Checking current users in database...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        whopCompanyId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - Company: ${user.whopCompanyId || 'None'}`);
      console.log(`   ID: ${user.id}, Created: ${user.createdAt.toISOString()}`);
    });
    
    if (users.length === 0) {
      console.log('✅ No users found - database is already clean!');
      return;
    }
    
    console.log('\n🗑️  Deleting all test users...');
    
    // Delete in correct order due to foreign key constraints
    
    // Delete challenge winners first
    const winnersResult = await prisma.challengeWinner.deleteMany({});
    console.log(`✅ Deleted ${winnersResult.count} challenge winners`);
    
    // Delete offer conversions
    const conversionsResult = await prisma.offerConversion.deleteMany({});
    console.log(`✅ Deleted ${conversionsResult.count} offer conversions`);
    
    // Delete challenge offers
    const offersResult = await prisma.challengeOffer.deleteMany({});
    console.log(`✅ Deleted ${offersResult.count} challenge offers`);
    
    // Delete enrollments
    const enrollmentDeleteResult = await prisma.enrollment.deleteMany({});
    console.log(`✅ Deleted ${enrollmentDeleteResult.count} enrollments`);
    
    // Delete challenges
    const challengeDeleteResult = await prisma.challenge.deleteMany({});
    console.log(`✅ Deleted ${challengeDeleteResult.count} challenges`);
    
    // Delete whop products
    const whopProductsResult = await prisma.whopProduct.deleteMany({});
    console.log(`✅ Deleted ${whopProductsResult.count} whop products`);
    
    // Delete whop subscriptions
    const whopSubscriptionDeleteResult = await prisma.whopSubscription.deleteMany({});
    console.log(`✅ Deleted ${whopSubscriptionDeleteResult.count} whop subscriptions`);
    
    // Delete monthly usage
    const monthlyUsageResult = await prisma.monthlyUsage.deleteMany({});
    console.log(`✅ Deleted ${monthlyUsageResult.count} monthly usage records`);
    
    // Delete users
    const userDeleteResult = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${userDeleteResult.count} users`);
    
    // Delete tenants last
    const tenantDeleteResult = await prisma.tenant.deleteMany({});
    console.log(`✅ Deleted ${tenantDeleteResult.count} tenants`);
    
    console.log('\n🎯 Database cleanup complete!');
    console.log('The database is now clean and ready for fresh Whop testing.');
    console.log('\nNext steps:');
    console.log('1. Go to your Whop app');
    console.log('2. Download/access the app as a company owner');
    console.log('3. You should see the onboarding page');
    console.log('4. Choose a subscription plan');
    console.log('5. After payment, you should get admin access');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestUsers();
