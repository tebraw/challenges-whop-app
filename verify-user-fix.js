const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUserFix() {
  console.log('🔍 VERIFYING: User after fix\n');

  try {
    // Check the latest user
    const latestUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!latestUser) {
      console.log('❌ No users found');
      return;
    }

    console.log('👤 LATEST USER (AFTER FIX):');
    console.log('   ID:', latestUser.id);
    console.log('   Email:', latestUser.email);
    console.log('   Company ID:', latestUser.whopCompanyId);
    console.log('   Experience ID:', latestUser.experienceId);
    console.log('   Role:', latestUser.role);
    console.log('   Tenant ID:', latestUser.tenantId);
    console.log();

    // Check if this is the correct company ID
    const expectedCompanyId = 'biz_uRE7hn9FdTpuUI';
    const isCorrect = latestUser.whopCompanyId === expectedCompanyId;
    
    console.log('🎯 VERIFICATION:');
    console.log('   Expected Company ID:', expectedCompanyId);
    console.log('   Actual Company ID:', latestUser.whopCompanyId);
    console.log('   Is Correct?', isCorrect ? '✅ YES' : '❌ NO');
    console.log('   Role is ADMIN?', latestUser.role === 'ADMIN' ? '✅ YES' : '❌ NO');
    console.log();

    // Check the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: latestUser.tenantId }
    });

    if (tenant) {
      console.log('🏢 ASSOCIATED TENANT:');
      console.log('   ID:', tenant.id);
      console.log('   Name:', tenant.name);
      console.log('   Whop Company ID:', tenant.whopCompanyId);
      console.log();
    }

    // Count users by company ID
    const usersWithFallback = await prisma.user.count({
      where: { whopCompanyId: '9nmw5yleoqldrxf7n48c' }
    });

    const usersWithCorrectId = await prisma.user.count({
      where: { whopCompanyId: expectedCompanyId }
    });

    console.log('📊 USER COUNT BY COMPANY ID:');
    console.log('   Fallback (9nmw5yleoqldrxf7n48c):', usersWithFallback);
    console.log('   Correct (biz_uRE7hn9FdTpuUI):', usersWithCorrectId);
    console.log();

    if (isCorrect && latestUser.role === 'ADMIN') {
      console.log('🎉 SUCCESS: User is correctly configured!');
      console.log('✅ Company ID: Correct');
      console.log('✅ Role: ADMIN (as experience owner)');
      console.log('🎯 Your colleague should now have proper isolated access.');
    } else {
      console.log('⚠️ Issues found:');
      if (!isCorrect) console.log('   - Company ID is still wrong');
      if (latestUser.role !== 'ADMIN') console.log('   - Role should be ADMIN for experience owner');
    }

  } catch (error) {
    console.error('❌ Error verifying user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUserFix();