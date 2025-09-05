// fix-admin-user.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAdminUser() {
  console.log('🔧 Fixing admin user with company ID...\n');

  try {
    // Update the demo admin user with the correct company ID
    const updatedUser = await prisma.user.update({
      where: { email: 'demo@example.com' },
      data: {
        whopCompanyId: 'biz_YoIIIT73rXwrtK', // From environment variable
        whopUserId: 'user_11HQI5KrNDW1S', // From environment variable
      }
    });

    console.log('✅ Updated admin user:', {
      email: updatedUser.email,
      role: updatedUser.role,
      whopCompanyId: updatedUser.whopCompanyId,
      whopUserId: updatedUser.whopUserId,
    });

  } catch (error) {
    console.error('❌ Error updating user:', error.message);
  }

  await prisma.$disconnect();
}

fixAdminUser().catch(console.error);
