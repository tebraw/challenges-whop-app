// Role Fix Script: Update user role based on Whop access level
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserRole() {
  console.log('🔧 Fixing user role for user_eGf5vVjIuGLSy...\n');
  
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { whopUserId: 'user_eGf5vVjIuGLSy' },
      select: {
        id: true,
        email: true,
        role: true,
        whopCompanyId: true,
        experienceId: true,
        tenant: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 Current user state:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Company ID: ${user.whopCompanyId}`);
    console.log(`   Experience ID: ${user.experienceId}`);
    console.log(`   Tenant: ${user.tenant?.name}\n`);
    
    // Check if user should be admin
    const shouldBeAdmin = user.experienceId && user.whopCompanyId.startsWith('biz_');
    
    if (shouldBeAdmin && user.role !== 'ADMIN') {
      console.log('🚀 User should be ADMIN - updating role...');
      
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'ADMIN'
        },
        select: {
          email: true,
          role: true
        }
      });
      
      console.log(`✅ User role updated: ${updatedUser.email} → ${updatedUser.role}`);
    } else if (user.role === 'ADMIN') {
      console.log('✅ User already has ADMIN role');
    } else {
      console.log('⚠️  User does not meet admin criteria');
      console.log(`   Has Experience ID: ${!!user.experienceId}`);
      console.log(`   Has Valid Company ID: ${user.whopCompanyId.startsWith('biz_')}`);
    }
    
  } catch (error) {
    console.error('❌ Role fix error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRole();