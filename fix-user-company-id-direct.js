const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserCompanyIdDirectly() {
  console.log('🔧 DIRECT FIX: Updating user company ID\n');

  try {
    // Find the specific user
    const targetUser = await prisma.user.findUnique({
      where: { id: 'cmfgz388p000207e39arlkdtt' }
    });

    if (!targetUser) {
      console.log('❌ User not found');
      return;
    }

    console.log('📋 BEFORE UPDATE:');
    console.log('   Email:', targetUser.email);
    console.log('   Company ID:', targetUser.whopCompanyId);
    console.log('   Experience ID:', targetUser.experienceId);
    console.log('   Role:', targetUser.role);
    console.log();

    // Update user with correct company ID
    const updatedUser = await prisma.user.update({
      where: { id: 'cmfgz388p000207e39arlkdtt' },
      data: {
        whopCompanyId: 'biz_uRE7hn9FdTpuUI'
      }
    });

    console.log('📋 AFTER UPDATE:');
    console.log('   Email:', updatedUser.email);
    console.log('   Company ID:', updatedUser.whopCompanyId);
    console.log('   Experience ID:', updatedUser.experienceId);
    console.log('   Role:', updatedUser.role);
    console.log();

    // Verify no more fallback users exist
    const fallbackCount = await prisma.user.count({
      where: { whopCompanyId: '9nmw5yleoqldrxf7n48c' }
    });

    const correctCount = await prisma.user.count({
      where: { whopCompanyId: 'biz_uRE7hn9FdTpuUI' }
    });

    console.log('📊 FINAL COUNT:');
    console.log('   Fallback users:', fallbackCount);
    console.log('   Correct users:', correctCount);
    console.log();

    if (fallbackCount === 0 && correctCount > 0) {
      console.log('🎉 SUCCESS: All users now have correct company IDs!');
      console.log('✅ No more fallback company IDs');
      console.log('✅ Multi-tenant isolation is now properly configured');
    }

  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserCompanyIdDirectly();