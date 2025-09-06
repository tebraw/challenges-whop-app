const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upgradeToCompanyOwner() {
  try {
    console.log('🔄 Upgrading user to Company Owner...');
    
    // Upgrade the specific user we see in debug to Company Owner
    const updated = await prisma.user.update({
      where: { id: 'cmf7ag9ep0002yagul0g0k0h6' }, // Your exact user ID
      data: { 
        role: 'ADMIN',
        whopCompanyId: 'biz_YoIIIT73rXwrtK' // Your company ID
      }
    });
    
    console.log('✅ Successfully upgraded user to Company Owner!');
    console.log('👤 User details:', {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      whopCompanyId: updated.whopCompanyId,
      whopUserId: updated.whopUserId
    });
    
    console.log('\n🎯 Now try accessing /admin again!');
    console.log('🔗 URL: https://challenges-whop-app-sqmr-6ka4m54e0-filip-grujicics-projects.vercel.app/admin');
    
  } catch (error) {
    console.error('❌ Error upgrading user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeToCompanyOwner();
