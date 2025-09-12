const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCompanyOwnerAdmin() {
  try {
    console.log('🎯 Creating Company Owner Admin for Testing\n');
    
    // Create a Company Owner (App Installer) with unique company ID
    const companyOwnerId = 'user_CompanyOwner123';
    const companyId = 'biz_YoIIIT73rXwrtK'; // The real company ID you provided earlier
    
    console.log('📋 Creating Company Owner:');
    console.log(`   User ID: ${companyOwnerId}`);
    console.log(`   Company ID: ${companyId}`);
    console.log(`   Role: ADMIN (App Installer)`);
    console.log('');
    
    // 1. Create Company Tenant
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
      console.log(`✅ Created Company Tenant: ${companyTenant.name}`);
    } else {
      console.log(`✅ Found existing Company Tenant: ${companyTenant.name}`);
    }
    
    // 2. Create Company Owner User
    let companyOwner = await prisma.user.findUnique({
      where: { whopUserId: companyOwnerId }
    });
    
    if (!companyOwner) {
      companyOwner = await prisma.user.create({
        data: {
          email: `${companyOwnerId}@whop.com`,
          name: 'Company Owner (App Installer)',
          whopUserId: companyOwnerId,
          whopCompanyId: companyId,
          experienceId: null, // Company Owner has NO experience ID
          role: 'ADMIN',
          tenantId: companyTenant.id
        }
      });
      console.log(`✅ Created Company Owner Admin: ${companyOwner.email}`);
    } else {
      // Update existing user to be admin
      companyOwner = await prisma.user.update({
        where: { id: companyOwner.id },
        data: { 
          role: 'ADMIN',
          whopCompanyId: companyId,
          experienceId: null,
          tenantId: companyTenant.id
        }
      });
      console.log(`✅ Updated Company Owner to Admin: ${companyOwner.email}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPANY OWNER ADMIN CREATED!\n');
    
    console.log('📋 Test Scenarios:');
    console.log('');
    console.log('1️⃣ COMPANY OWNER ACCESS:');
    console.log('   Headers to simulate:');
    console.log(`   x-whop-user-id: ${companyOwnerId}`);
    console.log(`   x-whop-company-id: ${companyId}`);
    console.log('   x-whop-experience-id: (NOT SET)');
    console.log('   → Should get ADMIN access');
    console.log('');
    
    console.log('2️⃣ EXPERIENCE MEMBER ACCESS:');
    console.log('   Headers to simulate:');
    console.log('   x-whop-user-id: user_eGf5vVjIuGLSy');
    console.log('   x-whop-experience-id: exp_3wSpfXnrRl7puA');
    console.log('   x-whop-company-id: (MAY BE EMPTY)');
    console.log('   → Should get USER access to their experience');
    console.log('');
    
    // 3. Show current state
    const allUsers = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    console.log('📊 CURRENT USER STATE:');
    allUsers.forEach(user => {
      console.log(`   ${user.role}: ${user.email}`);
      console.log(`   └─ Company: ${user.whopCompanyId || 'NULL'}`);
      console.log(`   └─ Experience: ${user.experienceId || 'NULL'}`);
      console.log(`   └─ Tenant: ${user.tenant?.name}`);
      console.log('');
    });
    
    const allTenants = await prisma.tenant.findMany({
      include: { users: true }
    });
    
    console.log('🏢 CURRENT TENANT STATE:');
    allTenants.forEach(tenant => {
      console.log(`   ${tenant.name} (ID: ${tenant.whopCompanyId})`);
      console.log(`   └─ Users: ${tenant.users.length}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error creating company owner:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCompanyOwnerAdmin();