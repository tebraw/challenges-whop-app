const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestInstallation() {
  console.log('🔍 CHECKING: Latest app installation after colleague reinstall\n');

  try {
    // Get the latest users (last 5)
    const latestUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('👥 LATEST USERS (Most recent first):');
    latestUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Company ID: ${user.whopCompanyId}`);
      console.log(`   Experience ID: ${user.experienceId}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Whop User ID: ${user.whopUserId}`);
    });

    // Check if new user was created
    const newUser = latestUsers[0];
    console.log('\n🔍 ANALYSIS OF NEWEST USER:');
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Company ID: ${newUser.whopCompanyId}`);
    console.log(`   Experience ID: ${newUser.experienceId || 'NULL'}`);
    console.log(`   Role: ${newUser.role}`);
    
    // Check if it's the correct company ID
    const expectedCompanyId = 'biz_uRE7hn9FdTpuUI';
    const isCorrectCompany = newUser.whopCompanyId === expectedCompanyId;
    const isAdmin = newUser.role === 'ADMIN';
    
    console.log('\n🎯 VALIDATION:');
    console.log(`   Expected Company ID: ${expectedCompanyId}`);
    console.log(`   Actual Company ID: ${newUser.whopCompanyId}`);
    console.log(`   Is Correct Company? ${isCorrectCompany ? '✅ YES' : '❌ NO'}`);
    console.log(`   Is Admin Role? ${isAdmin ? '✅ YES' : '❌ NO'}`);
    console.log(`   Can See Admin Page? ${isCorrectCompany && isAdmin ? '✅ YES' : '❌ NO'}`);

    // Check for fallback company ID usage
    if (newUser.whopCompanyId === '9nmw5yleoqldrxf7n48c') {
      console.log('\n❌ PROBLEM DETECTED:');
      console.log('   New user still has FALLBACK company ID!');
      console.log('   This means our fix did not work properly.');
      
      // Check if experience ID is available
      if (newUser.experienceId) {
        const correctId = `biz_${newUser.experienceId.replace('exp_', '')}`;
        console.log(`\n🔧 SHOULD BE:`);
        console.log(`   Experience ID: ${newUser.experienceId}`);
        console.log(`   Extracted Company ID: ${correctId}`);
      } else {
        console.log('\n❌ CRITICAL: No experience ID found - extraction impossible!');
      }
    }

    // Count users by company ID
    const usersWithFallback = await prisma.user.count({
      where: { whopCompanyId: '9nmw5yleoqldrxf7n48c' }
    });

    const usersWithCorrectId = await prisma.user.count({
      where: { whopCompanyId: expectedCompanyId }
    });

    console.log('\n📊 TOTAL USER COUNT BY COMPANY ID:');
    console.log(`   Fallback (9nmw5yleoqldrxf7n48c): ${usersWithFallback} users`);
    console.log(`   Correct (${expectedCompanyId}): ${usersWithCorrectId} users`);

    if (usersWithFallback > 0) {
      console.log('\n⚠️ WARNING: Fallback company IDs still being created!');
      console.log('   Our fix is not working as expected.');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestInstallation();