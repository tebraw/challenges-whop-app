// fix-all-admin-users.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAllAdminUsers() {
  console.log('🔧 Fixing ALL admin users with correct company ID...\n');

  try {
    // Update ALL admin users with the company ID
    const result = await prisma.user.updateMany({
      where: { role: 'ADMIN' },
      data: {
        whopCompanyId: 'biz_YoIIIT73rXwrtK',
        whopUserId: 'user_11HQI5KrNDW1S',
      }
    });

    console.log(`✅ Updated ${result.count} admin users`);

    // Show all admin users now
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        whopUserId: true,
        whopCompanyId: true,
      }
    });

    console.log('\n📋 All Admin Users:');
    adminUsers.forEach(user => {
      const isCompanyOwner = user.role === 'ADMIN' && user.whopCompanyId;
      console.log(`   ${isCompanyOwner ? '✅' : '❌'} ${user.email} - ${user.whopCompanyId || 'NO_COMPANY_ID'}`);
    });

  } catch (error) {
    console.error('❌ Error updating users:', error.message);
  }

  await prisma.$disconnect();
}

fixAllAdminUsers().catch(console.error);
