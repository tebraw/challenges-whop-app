const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeFirstUserCompanyOwner() {
  console.log('🎯 PROMOTING FIRST USER TO COMPANY OWNER\n');
  
  try {
    // Get first user (will become company owner)
    const firstUser = await prisma.user.findFirst({
      where: {
        whopCompanyId: '9nmw5yleoqldrxf7n48c'
      },
      include: { tenant: true }
    });
    
    if (!firstUser) {
      console.log('❌ No users found with company ID');
      return;
    }
    
    console.log(`📋 Promoting user to Company Owner:`);
    console.log(`   Email: ${firstUser.email}`);
    console.log(`   WhopUserId: ${firstUser.whopUserId}`);
    console.log(`   Current Role: ${firstUser.role}`);
    console.log('');
    
    // Create company tenant
    const companyId = firstUser.whopCompanyId;
    let companyTenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: companyId }
    });
    
    if (!companyTenant) {
      companyTenant = await prisma.tenant.create({
        data: {
          name: `Company ${companyId}`,
          whopCompanyId: companyId
        }
      });
      console.log(`✅ Created company tenant: ${companyTenant.name}`);
    } else {
      console.log(`✅ Found existing company tenant: ${companyTenant.name}`);
    }
    
    // Update user to be company owner admin
    const updatedUser = await prisma.user.update({
      where: { id: firstUser.id },
      data: {
        role: 'ADMIN',
        experienceId: null, // Company owners don't have experience ID
        tenantId: companyTenant.id
      }
    });
    
    console.log(`🎉 SUCCESS! User promoted to Company Owner Admin:`);
    console.log(`   ✅ Role: ${updatedUser.role}`);
    console.log(`   ✅ Company ID: ${updatedUser.whopCompanyId}`);
    console.log(`   ✅ Experience ID: ${updatedUser.experienceId || 'NULL (Company Owner)'}`);
    console.log(`   ✅ Tenant: Company-based`);
    console.log('');
    
    // Now handle the second user as experience member
    const secondUser = await prisma.user.findFirst({
      where: {
        whopCompanyId: '9nmw5yleoqldrxf7n48c',
        id: { not: firstUser.id }
      }
    });
    
    if (secondUser && secondUser.experienceId) {
      console.log(`📋 Setting up second user as Experience Member:`);
      console.log(`   Email: ${secondUser.email}`);
      console.log(`   Experience ID: ${secondUser.experienceId}`);
      
      // Create experience tenant
      let experienceTenant = await prisma.tenant.findUnique({
        where: { whopCompanyId: secondUser.experienceId }
      });
      
      if (!experienceTenant) {
        experienceTenant = await prisma.tenant.create({
          data: {
            name: `Experience ${secondUser.experienceId}`,
            whopCompanyId: secondUser.experienceId
          }
        });
        console.log(`   ✅ Created experience tenant: ${experienceTenant.name}`);
      }
      
      // Update second user
      await prisma.user.update({
        where: { id: secondUser.id },
        data: {
          role: 'USER',
          tenantId: experienceTenant.id
        }
      });
      
      console.log(`   ✅ Updated as Experience Member (USER role)`);
    }
    
    // Show final state
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL MULTI-TENANT STATE:\n');
    
    const allUsers = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    const allTenants = await prisma.tenant.findMany({
      include: { users: true }
    });
    
    console.log('👥 USERS:');
    allUsers.forEach(user => {
      console.log(`   ${user.role}: ${user.email}`);
      console.log(`   └─ Company ID: ${user.whopCompanyId || 'NULL'}`);
      console.log(`   └─ Experience ID: ${user.experienceId || 'NULL'}`);
      console.log(`   └─ Tenant: ${user.tenant?.name}`);
      console.log('');
    });
    
    console.log('🏢 TENANTS:');
    allTenants.forEach(tenant => {
      console.log(`   ${tenant.name}`);
      console.log(`   └─ Identifier: ${tenant.whopCompanyId}`);
      console.log(`   └─ Users: ${tenant.users.length}`);
      console.log('');
    });
    
    console.log('🎯 TEST SCENARIOS:');
    console.log('');
    console.log('1️⃣ Company Owner Admin Access:');
    console.log('   Headers:');
    console.log(`   x-whop-user-id: ${updatedUser.whopUserId}`);
    console.log(`   x-whop-company-id: ${updatedUser.whopCompanyId}`);
    console.log('   x-whop-experience-id: (NOT SET)');
    console.log('   Expected: ADMIN access to admin panel');
    console.log('');
    
    if (secondUser) {
      console.log('2️⃣ Experience Member Access:');
      console.log('   Headers:');
      console.log(`   x-whop-user-id: ${secondUser.whopUserId}`);
      console.log(`   x-whop-experience-id: ${secondUser.experienceId}`);
      console.log('   x-whop-company-id: (MAY BE SET)');
      console.log('   Expected: USER access to experience content');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeFirstUserCompanyOwner();