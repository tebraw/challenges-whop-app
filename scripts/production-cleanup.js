// scripts/production-cleanup.js
// Script für finale Production-Bereinigung

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function productionCleanup() {
  try {
    console.log('🚀 Production Cleanup Started');
    console.log('==============================');
    
    // 1. Delete test challenge "gfdg dfg dfgdf g"
    const testChallengeId = 'cmf5p3v080001t3roeld67wei';
    
    console.log('🗑️  Deleting test challenge and related data...');
    
    // Delete enrollments first
    const enrollments = await prisma.enrollment.deleteMany({
      where: { challengeId: testChallengeId }
    });
    console.log(`   ✅ Deleted ${enrollments.count} enrollments`);
    
    // Delete challenge offers
    const offers = await prisma.challengeOffer.deleteMany({
      where: { challengeId: testChallengeId }
    });
    console.log(`   ✅ Deleted ${offers.count} challenge offers`);
    
    // Delete winners
    const winners = await prisma.challengeWinner.deleteMany({
      where: { challengeId: testChallengeId }
    });
    console.log(`   ✅ Deleted ${winners.count} winners`);
    
    // Delete the challenge
    const challenge = await prisma.challenge.delete({
      where: { id: testChallengeId }
    });
    console.log(`   ✅ Deleted challenge: "${challenge.title}"`);
    
    // 2. Delete test user "demo@example.com"
    console.log('\n👤 Deleting test user...');
    
    const testUser = await prisma.user.delete({
      where: { email: 'demo@example.com' }
    });
    console.log(`   ✅ Deleted user: ${testUser.name} (${testUser.email})`);
    
    // 3. Verify clean state
    console.log('\n🔍 Verifying clean database state...');
    
    const remainingChallenges = await prisma.challenge.count();
    const remainingUsers = await prisma.user.count();
    const remainingEnrollments = await prisma.enrollment.count();
    
    console.log(`   📊 Remaining challenges: ${remainingChallenges}`);
    console.log(`   👥 Remaining users: ${remainingUsers}`);
    console.log(`   📝 Remaining enrollments: ${remainingEnrollments}`);
    
    if (remainingChallenges === 0 && remainingUsers === 0 && remainingEnrollments === 0) {
      console.log('\n✨ Database is now clean and ready for production!');
    } else {
      console.log('\n⚠️  Some data remains - please review before production deployment.');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

productionCleanup();
