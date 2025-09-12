// Database cleanup script - Reset everything for fresh testing
const { PrismaClient } = require('@prisma/client');

async function cleanDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 Starting complete database cleanup...\n');

    // Delete in correct order to respect foreign key constraints
    console.log('1. Deleting Checkins...');
    const checkins = await prisma.checkin.deleteMany();
    console.log(`   ✅ Deleted ${checkins.count} checkins`);

    console.log('2. Deleting Proofs...');
    const proofs = await prisma.proof.deleteMany();
    console.log(`   ✅ Deleted ${proofs.count} proofs`);

    console.log('3. Deleting Challenge Winners...');
    const winners = await prisma.challengeWinner.deleteMany();
    console.log(`   ✅ Deleted ${winners.count} challenge winners`);

    console.log('4. Deleting Offer Conversions...');
    const conversions = await prisma.offerConversion.deleteMany();
    console.log(`   ✅ Deleted ${conversions.count} offer conversions`);

    console.log('5. Deleting Challenge Offers...');
    const offers = await prisma.challengeOffer.deleteMany();
    console.log(`   ✅ Deleted ${offers.count} challenge offers`);

    console.log('6. Deleting Enrollments...');
    const enrollments = await prisma.enrollment.deleteMany();
    console.log(`   ✅ Deleted ${enrollments.count} enrollments`);

    console.log('7. Deleting Whop Products...');
    const products = await prisma.whopProduct.deleteMany();
    console.log(`   ✅ Deleted ${products.count} whop products`);

    console.log('8. Deleting Challenges...');
    const challenges = await prisma.challenge.deleteMany();
    console.log(`   ✅ Deleted ${challenges.count} challenges`);

    console.log('9. Deleting Users...');
    const users = await prisma.user.deleteMany();
    console.log(`   ✅ Deleted ${users.count} users`);

    console.log('10. Deleting Tenants...');
    const tenants = await prisma.tenant.deleteMany();
    console.log(`    ✅ Deleted ${tenants.count} tenants`);

    console.log('\n🎉 Database cleanup complete!');
    console.log('\n📊 Summary:');
    console.log(`   • ${checkins.count} checkins removed`);
    console.log(`   • ${proofs.count} proofs removed`);
    console.log(`   • ${winners.count} winners removed`);
    console.log(`   • ${conversions.count} conversions removed`);
    console.log(`   • ${offers.count} offers removed`);
    console.log(`   • ${enrollments.count} enrollments removed`);
    console.log(`   • ${products.count} products removed`);
    console.log(`   • ${challenges.count} challenges removed`);
    console.log(`   • ${users.count} users removed`);
    console.log(`   • ${tenants.count} tenants removed`);

    console.log('\n✨ Database is now completely clean and ready for fresh testing!');
    console.log('\n🧪 Next steps:');
    console.log('   1. Du und deine Kollegen installiert die App neu in Whop');
    console.log('   2. Jeder benutzt eine andere Experience');
    console.log('   3. Erstellt Challenges in euren jeweiligen Experiences');
    console.log('   4. Verifiziert, dass ihr nur eure eigenen Challenges seht');
    console.log('\n🎯 Expected result: Perfekte Experience-based Isolation!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.log('\n💡 If you see foreign key constraint errors, try running the script again.');
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!');
console.log('📋 This includes:');
console.log('   • All challenges');
console.log('   • All users');
console.log('   • All enrollments');
console.log('   • All checkins');
console.log('   • All winners');
console.log('   • All tenants');
console.log('   • Everything else');
console.log('\n🔄 Starting cleanup in 3 seconds...');

setTimeout(() => {
  cleanDatabase();
}, 3000);