// 🧹 COMPLETE DATABASE CLEANUP SCRIPT
// This will remove ALL data from ALL tables to solve performance issues

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupCompleteDatabase() {
  console.log('🧹 STARTING COMPLETE DATABASE CLEANUP...');
  console.log('⚠️  This will DELETE ALL DATA from ALL tables!');
  
  try {
    // Delete in correct order to avoid foreign key constraints
    console.log('🗑️  Deleting InternalNotifications...');
    const deletedNotifications = await prisma.internalNotification.deleteMany({});
    console.log(`   ✅ Deleted ${deletedNotifications.count} notifications`);

    console.log('🗑️  Deleting ChallengeOffers...');
    const deletedOffers = await prisma.challengeOffer.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOffers.count} offers`);

    console.log('🗑️  Deleting Winners...');
    const deletedWinners = await prisma.challengeWinner.deleteMany({});
    console.log(`   ✅ Deleted ${deletedWinners.count} winners`);

    console.log('🗑️  Deleting Proofs...');
    const deletedProofs = await prisma.proof.deleteMany({});
    console.log(`   ✅ Deleted ${deletedProofs.count} proofs`);

    console.log('🗑️  Deleting Enrollments...');
    const deletedEnrollments = await prisma.enrollment.deleteMany({});
    console.log(`   ✅ Deleted ${deletedEnrollments.count} enrollments`);

    console.log('🗑️  Deleting Challenges...');
    const deletedChallenges = await prisma.challenge.deleteMany({});
    console.log(`   ✅ Deleted ${deletedChallenges.count} challenges`);

    console.log('🗑️  Deleting WhopProducts...');
    const deletedProducts = await prisma.whopProduct.deleteMany({});
    console.log(`   ✅ Deleted ${deletedProducts.count} products`);

    console.log('🗑️  Deleting Users...');
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`   ✅ Deleted ${deletedUsers.count} users`);

    console.log('🗑️  Deleting Tenants...');
    const deletedTenants = await prisma.tenant.deleteMany({});
    console.log(`   ✅ Deleted ${deletedTenants.count} tenants`);

    console.log('');
    console.log('🎉 DATABASE CLEANUP COMPLETE!');
    console.log('');
    console.log('✅ ALL DATA DELETED SUCCESSFULLY');
    console.log('🚀 Database is now clean and ready for fresh testing');
    console.log('');
    console.log('NEXT STEPS:');
    console.log('1. Try accessing the Whop Dashboard App now');
    console.log('2. Create a new challenge to test performance');
    console.log('3. Monitor Vercel logs for any remaining issues');
    console.log('');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupCompleteDatabase();