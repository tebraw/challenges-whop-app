const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function giveAdminAccess() {
  try {
    // Update the specific user with admin rights
    const updated = await prisma.user.update({
      where: { id: 'cmf7ag9ep0002yagul0g0k0h6' }, // Your user ID from debug
      data: { 
        role: 'ADMIN',
        whopCompanyId: 'biz_YoIIIT73rXwrtK' // Your actual company ID
      }
    });
    console.log('✅ Granted admin access to user:', updated);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

giveAdminAccess();
