// Fix current admin user with company ID
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCurrentAdmin() {
  console.log('🔧 Fixing current admin user with company ID...\n');

  try {
    // First, check if admin exists
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@localhost.com' }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Current admin user:', {
      email: adminUser.email,
      role: adminUser.role,
      whopCompanyId: adminUser.whopCompanyId,
      whopUserId: adminUser.whopUserId,
    });

    // Update with a valid company ID
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@localhost.com' },
      data: {
        whopCompanyId: 'biz_admin_company_test', // Test company ID for admin
        whopUserId: adminUser.whopUserId || 'admin_whop_123', // Keep existing or set default
      }
    });

    console.log('\n✅ Updated admin user:', {
      email: updatedUser.email,
      role: updatedUser.role,
      whopCompanyId: updatedUser.whopCompanyId,
      whopUserId: updatedUser.whopUserId,
    });

    console.log('\n🎉 Admin should now have access to /admin dashboard');

  } catch (error) {
    console.error('❌ Error updating admin user:', error.message);
  }

  await prisma.$disconnect();
}

fixCurrentAdmin().catch(console.error);