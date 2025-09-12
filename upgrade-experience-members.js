// Bulk Role Upgrade Script: Upgrade Experience Members with valid Company IDs to Admin
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upgradeExperienceMembers() {
  console.log('🚀 Upgrading Experience Members with valid Company IDs to Admin...\n');
  
  try {
    // Find all users with valid company IDs but USER role
    const candidateUsers = await prisma.user.findMany({
      where: {
        role: 'USER',
        whopCompanyId: {
          startsWith: 'biz_'
        },
        experienceId: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        whopUserId: true,
        whopCompanyId: true,
        experienceId: true,
        role: true
      }
    });
    
    console.log(`📊 Found ${candidateUsers.length} users to potentially upgrade\n`);
    
    if (candidateUsers.length === 0) {
      console.log('✅ No users need upgrading');
      return;
    }
    
    for (const user of candidateUsers) {
      console.log(`👤 Processing: ${user.email}`);
      console.log(`   Company ID: ${user.whopCompanyId}`);
      console.log(`   Experience ID: ${user.experienceId}`);
      console.log(`   Current Role: ${user.role}`);
      
      // Check if they should be admin (valid company ID + experience ID)
      const shouldBeAdmin = user.whopCompanyId.startsWith('biz_') && user.experienceId;
      
      if (shouldBeAdmin) {
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'ADMIN'
          }
        });
        
        console.log(`   ✅ Upgraded to ADMIN\n`);
      } else {
        console.log(`   ⚠️  Skipped - doesn't meet criteria\n`);
      }
    }
    
    // Show final summary
    const totalAdmins = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    const totalUsers = await prisma.user.count();
    
    console.log('📈 FINAL SUMMARY:');
    console.log(`- Total Users: ${totalUsers}`);
    console.log(`- Total Admins: ${totalAdmins}`);
    console.log(`- Admin Percentage: ${((totalAdmins / totalUsers) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Bulk upgrade error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeExperienceMembers();