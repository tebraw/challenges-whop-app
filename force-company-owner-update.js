const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceCompanyOwnerUpdate() {
  try {
    console.log('🔄 Force updating user to Company Owner...');
    
    // Update the specific user we see in debug with extracted company ID
    const updated = await prisma.user.update({
      where: { 
        whopUserId: 'user_eGf5vVjIuGLSy' // Your exact Whop user ID
      },
      data: { 
        role: 'ADMIN',
        whopCompanyId: '9nmw5yleoqldrxf7n48c' // Your extracted company ID
      }
    });
    
    console.log('✅ Successfully updated user to Company Owner!');
    console.log('👤 User details:', {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      whopCompanyId: updated.whopCompanyId,
      whopUserId: updated.whopUserId
    });
    
    console.log('\n🎯 Now try accessing /admin again!');
    console.log('🔗 URL: https://challenges-whop-app-sqmr-ozvpmjx5r-filip-grujicics-projects.vercel.app/admin');
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceCompanyOwnerUpdate();
