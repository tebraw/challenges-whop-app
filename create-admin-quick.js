const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Get the first user and promote them to admin
    const firstUser = await prisma.user.findFirst();
    
    if (!firstUser) {
      console.log('❌ No users found');
      return;
    }
    
    console.log(`📋 Promoting user ${firstUser.email} to ADMIN role`);
    
    const updatedUser = await prisma.user.update({
      where: { id: firstUser.id },
      data: { role: 'ADMIN' },
      include: { tenant: true }
    });
    
    console.log('✅ Admin user created:');
    console.log(`- Email: ${updatedUser.email}`);
    console.log(`- Role: ${updatedUser.role}`);
    console.log(`- WhopUserId: ${updatedUser.whopUserId}`);
    console.log(`- ExperienceId: ${updatedUser.experienceId}`);
    console.log(`- TenantId: ${updatedUser.tenantId}`);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();