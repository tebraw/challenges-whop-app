// Clean database for fresh multi-tenancy testing
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log('🧹 Cleaning database for fresh multi-tenancy testing...\n');
    
    // First, show what we're about to delete
    const users = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    console.log(`📊 Found ${users.length} users to delete:`);
    users.forEach(user => {
      console.log(`- ${user.email} (Tenant: ${user.tenant.name}, Role: ${user.role})`);
    });
    
    const challenges = await prisma.challenge.findMany({
      include: { tenant: true, creator: true }
    });
    
    console.log(`\n📊 Found ${challenges.length} challenges to delete:`);
    challenges.forEach(challenge => {
      console.log(`- "${challenge.title}" (Tenant: ${challenge.tenant.name}, Creator: ${challenge.creator?.email || 'Unknown'})`);
    });
    
    // Delete in correct order due to foreign key constraints
    console.log('\n🗑️ Deleting data...');
    
    // 1. Delete proofs first (references enrollments)
    const proofCount = await prisma.proof.deleteMany({});
    console.log(`✅ Deleted ${proofCount.count} proofs`);
    
    // 2. Delete winners (references challenges and users)
    const winnerCount = await prisma.challengeWinner.deleteMany({});
    console.log(`✅ Deleted ${winnerCount.count} winners`);
    
    // 3. Delete enrollments (references challenges and users)
    const enrollmentCount = await prisma.enrollment.deleteMany({});
    console.log(`✅ Deleted ${enrollmentCount.count} enrollments`);
    
    // 4. Delete challenge offers (references challenges)
    const offerCount = await prisma.challengeOffer.deleteMany({});
    console.log(`✅ Deleted ${offerCount.count} challenge offers`);
    
    // 5. Delete offer conversions (references users)
    const conversionCount = await prisma.offerConversion.deleteMany({});
    console.log(`✅ Deleted ${conversionCount.count} offer conversions`);
    
    // 6. Delete challenges (references users and tenants)
    const challengeCount = await prisma.challenge.deleteMany({});
    console.log(`✅ Deleted ${challengeCount.count} challenges`);
    
    // 7. Delete whop products (references users)
    const whopProductCount = await prisma.whopProduct.deleteMany({});
    console.log(`✅ Deleted ${whopProductCount.count} whop products`);
    
    // 8. Delete users (references tenants)
    const userCount = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${userCount.count} users`);
    
    // 9. Delete tenants (no dependencies)
    const tenantCount = await prisma.tenant.deleteMany({});
    console.log(`✅ Deleted ${tenantCount.count} tenants`);
    
    console.log('\n🎉 Database cleaned successfully!');
    console.log('\nNow you can test the multi-tenancy system from scratch:');
    console.log('1. Install the app in different Whop companies');
    console.log('2. Each company will get its own isolated tenant');
    console.log('3. Users from different companies should not see each other\'s data');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();