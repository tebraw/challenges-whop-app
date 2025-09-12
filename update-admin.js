const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminUser() {
  try {
    // Update the admin@test.com user to have company access
    const updated = await prisma.user.update({
      where: { email: 'admin@test.com' },
      data: {
        whopCompanyId: 'biz_admin_company_test'
      }
    });
    
    console.log('✅ Updated admin user:', updated.email, '- Company ID:', updated.whopCompanyId);
    
    // Also ensure admin@localhost.com has the right setup
    const mainAdmin = await prisma.user.findUnique({
      where: { email: 'admin@localhost.com' }
    });
    
    if (mainAdmin) {
      console.log('✅ Main admin user already exists with Company ID:', mainAdmin.whopCompanyId);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminUser();