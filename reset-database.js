const { PrismaClient } = require('@prisma/client');

async function resetDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🗑️  RESETTING DATABASE - Deleting all data...');
    
    // Delete in correct order (foreign key constraints)
    console.log('   • Deleting Enrollments...');
    await prisma.enrollment.deleteMany({});
    
    console.log('   • Deleting Challenges...');
    await prisma.challenge.deleteMany({});
    
    console.log('   • Deleting Users...');
    await prisma.user.deleteMany({});
    
    console.log('   • Deleting Tenants...');
    await prisma.tenant.deleteMany({});
    
    console.log('✅ Database completely reset!');
    
    // Verify empty state
    const userCount = await prisma.user.count();
    const tenantCount = await prisma.tenant.count();
    const challengeCount = await prisma.challenge.count();
    const enrollmentCount = await prisma.enrollment.count();
    
    console.log('\n📊 Final counts:');
    console.log(`   • Users: ${userCount}`);
    console.log(`   • Tenants: ${tenantCount}`);
    console.log(`   • Challenges: ${challengeCount}`);
    console.log(`   • Enrollments: ${enrollmentCount}`);
    
    if (userCount === 0 && tenantCount === 0 && challengeCount === 0 && enrollmentCount === 0) {
      console.log('\n🎉 Database is completely clean!');
    } else {
      console.log('\n⚠️  Some data still remains');
    }
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();