// Script to update admin user with whopCompanyId for admin access
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminUser() {
  try {
    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    // Update with whopCompanyId for admin access
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        whopCompanyId: 'dev_company_123' // Required for admin access
      }
    });

    console.log('✅ Admin user updated successfully!');
    console.log('📧 Email:', updatedUser.email);
    console.log('🏢 Company ID:', updatedUser.whopCompanyId);
    console.log('');
    console.log('🔧 Setting development cookie for easy access...');
    
    // Also show how to set the cookie for development
    console.log('');
    console.log('🍪 Run this in your browser console to set the dev cookie:');
    console.log(`document.cookie = "as=${updatedUser.id}; path=/";`);
    console.log('');
    console.log('🚀 Then refresh the page and go to: http://localhost:3000/admin');

  } catch (error) {
    console.error('❌ Error updating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminUser();
