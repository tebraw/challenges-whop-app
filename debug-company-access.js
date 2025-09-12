// Advanced Company Owner Debug - Check what different companies see
const { PrismaClient } = require('@prisma/client');

async function debugCompanyAccess() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 DEBUGGING COMPANY OWNER ACCESS ISSUES...\n');
    
    // Get all tenants and their users
    const allTenants = await prisma.tenant.findMany({
      include: {
        users: true,
        challenges: true
      }
    });
    
    console.log('📊 DATABASE STATE:');
    allTenants.forEach(tenant => {
      console.log(`\n🏢 ${tenant.name}`);
      console.log(`   Company ID: ${tenant.whopCompanyId}`);
      console.log(`   Tenant ID: ${tenant.id}`);
      console.log(`   Users: ${tenant.users.length}`);
      console.log(`   Challenges: ${tenant.challenges.length}`);
      
      if (tenant.users.length > 0) {
        tenant.users.forEach(user => {
          console.log(`     👤 ${user.email || user.whopUserId} (Role: ${user.role})`);
        });
      }
      
      if (tenant.challenges.length > 0) {
        tenant.challenges.forEach(challenge => {
          console.log(`     📋 ${challenge.title}`);
        });
      }
    });
    
    console.log('\n🎯 TESTING COMPANY ACCESS SIMULATION:');
    
    // Simulate what each company would see via API
    for (const tenant of allTenants) {
      if (tenant.whopCompanyId) {
        console.log(`\n🧪 Testing Company: ${tenant.whopCompanyId}`);
        
        // Simulate API call for this company
        const apiResponse = await prisma.challenge.findMany({
          where: {
            tenant: {
              whopCompanyId: tenant.whopCompanyId
            }
          },
          include: {
            tenant: true
          }
        });
        
        console.log(`   ✅ API would return: ${apiResponse.length} challenges`);
        if (apiResponse.length > 0) {
          apiResponse.forEach(challenge => {
            console.log(`     - ${challenge.title} (Tenant: ${challenge.tenant.name})`);
          });
        }
        
        // Check if tenant exists and is accessible
        const tenantLookup = await prisma.tenant.findUnique({
          where: { whopCompanyId: tenant.whopCompanyId }
        });
        
        console.log(`   🔍 Tenant lookup: ${tenantLookup ? 'SUCCESS' : 'FAILED'}`);
        
        // This is what the admin API logic does
        if (tenantLookup) {
          console.log(`   👑 Should get ADMIN ACCESS: YES`);
        } else {
          console.log(`   ❌ Should get ADMIN ACCESS: NO (tenant not found)`);
        }
      }
    }
    
    console.log('\n📋 WHOP APP CONFIGURATION RECOMMENDATIONS:');
    
    allTenants.forEach(tenant => {
      if (tenant.whopCompanyId) {
        console.log(`\n🏢 Company: ${tenant.whopCompanyId}`);
        console.log(`   ✅ Ready for Whop App installation`);
        console.log(`   🎯 Company Owner will get admin access`);
        console.log(`   📊 Current challenges: ${tenant.challenges.length}`);
        
        if (tenant.challenges.length === 0) {
          console.log(`   💡 This company can start creating challenges`);
        }
      }
    });
    
    console.log('\n🚨 POTENTIAL ISSUES:');
    
    // Check for companies without users
    const companiesWithoutUsers = allTenants.filter(t => t.users.length === 0 && t.whopCompanyId);
    if (companiesWithoutUsers.length > 0) {
      console.log(`⚠️  ${companiesWithoutUsers.length} companies have no users yet:`);
      companiesWithoutUsers.forEach(t => {
        console.log(`   - ${t.whopCompanyId} (${t.name})`);
      });
      console.log(`   This is normal for new companies that haven't opened the app yet.`);
    }
    
    // Check for missing company IDs
    const tenantsWithoutCompany = allTenants.filter(t => !t.whopCompanyId);
    if (tenantsWithoutCompany.length > 0) {
      console.log(`🚨 ${tenantsWithoutCompany.length} tenants have no company ID (CRITICAL ISSUE):`);
      tenantsWithoutCompany.forEach(t => {
        console.log(`   - ${t.name} (${t.id})`);
      });
    }
    
    console.log('\n✅ SUMMARY:');
    console.log(`📊 Total companies: ${allTenants.filter(t => t.whopCompanyId).length}`);
    console.log(`👥 Total users: ${allTenants.reduce((sum, t) => sum + t.users.length, 0)}`);
    console.log(`📋 Total challenges: ${allTenants.reduce((sum, t) => sum + t.challenges.length, 0)}`);
    console.log(`🎯 All companies should get admin access based on their company ID`);
    
  } catch (error) {
    console.error('Error in debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCompanyAccess();