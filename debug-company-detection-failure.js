// EMERGENCY: Debug Company Detection Failure
const { PrismaClient } = require('@prisma/client');

async function debugCompanyDetectionFailure() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 EMERGENCY: Company Detection Failure Analysis\n');
    
    // Get all users and their company assignments
    const allUsers = await prisma.user.findMany({
      include: {
        tenant: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${allUsers.length} users in database\n`);
    
    allUsers.forEach((user, index) => {
      console.log(`👤 USER ${index + 1}: ${user.email || user.whopUserId}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Whop User ID: ${user.whopUserId || 'NULL'}`);
      console.log(`   User whopCompanyId: ${user.whopCompanyId || 'NULL'}`);
      console.log(`   User tenantId: ${user.tenantId}`);
      console.log(`   User role: ${user.role}`);
      console.log(`   Tenant info:`);
      console.log(`     tenant.id: ${user.tenant?.id || 'NULL'}`);
      console.log(`     tenant.whopCompanyId: ${user.tenant?.whopCompanyId || 'NULL'}`);
      console.log(`     tenant.name: ${user.tenant?.name || 'NULL'}`);
      
      // Check for inconsistencies
      if (user.whopCompanyId !== user.tenant?.whopCompanyId) {
        console.log(`   🚨 MISMATCH: User company (${user.whopCompanyId}) ≠ Tenant company (${user.tenant?.whopCompanyId})`);
      } else {
        console.log(`   ✅ Company IDs match`);
      }
      
      console.log();
    });
    
    // Group users by whopCompanyId
    console.log('🏢 USERS GROUPED BY COMPANY:\n');
    
    const usersByCompany = {};
    allUsers.forEach(user => {
      const companyId = user.whopCompanyId || 'NO_COMPANY';
      if (!usersByCompany[companyId]) {
        usersByCompany[companyId] = [];
      }
      usersByCompany[companyId].push(user);
    });
    
    Object.entries(usersByCompany).forEach(([companyId, users]) => {
      console.log(`🏢 Company: ${companyId}`);
      console.log(`   Users: ${users.length}`);
      users.forEach(user => {
        console.log(`     - ${user.email || user.whopUserId} (Role: ${user.role}, Tenant: ${user.tenantId})`);
      });
      console.log();
    });
    
    // Check challenges per user
    console.log('🎯 CHALLENGES PER USER:\n');
    
    for (const user of allUsers) {
      const userChallenges = await prisma.challenge.findMany({
        where: {
          creatorId: user.id
        }
      });
      
      console.log(`👤 ${user.email || user.whopUserId}:`);
      console.log(`   Company: ${user.whopCompanyId}`);
      console.log(`   Tenant: ${user.tenantId}`);
      console.log(`   Created challenges: ${userChallenges.length}`);
      
      userChallenges.forEach(challenge => {
        console.log(`     - "${challenge.title}"`);
        console.log(`       Challenge tenantId: ${challenge.tenantId}`);
        console.log(`       Challenge whopCompanyId: ${challenge.whopCompanyId || 'NULL'}`);
      });
      
      console.log();
    }
    
    // CRITICAL: Check what each user would see via API
    console.log('🔍 CRITICAL: API Access Simulation\n');
    
    const uniqueCompanies = [...new Set(allUsers.map(u => u.whopCompanyId).filter(Boolean))];
    
    for (const companyId of uniqueCompanies) {
      console.log(`🏢 Company: ${companyId}`);
      
      // Find tenant for this company
      const tenant = await prisma.tenant.findUnique({
        where: { whopCompanyId: companyId }
      });
      
      if (tenant) {
        // What would the API return for this company?
        const apiResult = await prisma.challenge.findMany({
          where: {
            tenantId: tenant.id
          }
        });
        
        console.log(`   Tenant: ${tenant.id} (${tenant.name})`);
        console.log(`   API would return: ${apiResult.length} challenges`);
        
        apiResult.forEach(challenge => {
          console.log(`     - "${challenge.title}" (Created by: ${challenge.creatorId})`);
          console.log(`       Challenge whopCompanyId: ${challenge.whopCompanyId || 'NULL'}`);
        });
        
        // Check if challenges from other companies leak in
        const leakedChallenges = apiResult.filter(c => c.whopCompanyId && c.whopCompanyId !== companyId);
        if (leakedChallenges.length > 0) {
          console.log(`   🚨 LEAKED CHALLENGES: ${leakedChallenges.length} from other companies!`);
          leakedChallenges.forEach(challenge => {
            console.log(`     ❌ "${challenge.title}" belongs to company ${challenge.whopCompanyId}`);
          });
        }
      } else {
        console.log(`   ❌ No tenant found for company ${companyId}!`);
      }
      
      console.log();
    }
    
    // Final diagnosis
    console.log('🩺 DIAGNOSIS:\n');
    
    const totalCompanies = uniqueCompanies.length;
    const totalTenants = await prisma.tenant.count({
      where: { whopCompanyId: { not: null } }
    });
    
    console.log(`Unique companies in users: ${totalCompanies}`);
    console.log(`Unique tenants in database: ${totalTenants}`);
    
    if (totalCompanies !== totalTenants) {
      console.log('🚨 MISMATCH: Number of companies ≠ number of tenants!');
    }
    
    // Check if users from different companies are in same tenant
    const problematicTenants = await prisma.tenant.findMany({
      include: {
        users: true
      },
      where: {
        whopCompanyId: { not: null }
      }
    });
    
    problematicTenants.forEach(tenant => {
      const userCompanies = [...new Set(tenant.users.map(u => u.whopCompanyId))];
      if (userCompanies.length > 1) {
        console.log(`🚨 TENANT CONTAMINATION: Tenant ${tenant.id} has users from ${userCompanies.length} different companies:`);
        userCompanies.forEach(companyId => {
          console.log(`   - Company: ${companyId}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error in diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCompanyDetectionFailure();