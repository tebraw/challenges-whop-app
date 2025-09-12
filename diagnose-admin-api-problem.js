// URGENT FIX: Admin API using wrong company logic
// The admin API needs to use user-specific sub-tenants!

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseAdminApiProblem() {
  console.log('🚨 DIAGNOSING ADMIN API PROBLEM\n');
  
  console.log('📋 CURRENT TENANT STRUCTURE:\n');
  
  const allTenants = await prisma.tenant.findMany({
    include: {
      users: true,
      challenges: true
    }
  });
  
  for (const tenant of allTenants) {
    console.log(`🏢 Tenant: ${tenant.name}`);
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Company ID: ${tenant.whopCompanyId}`);
    console.log(`   Users: ${tenant.users.length}`);
    console.log(`   Challenges: ${tenant.challenges.length}`);
    console.log('');
  }
  
  console.log('🔍 THE PROBLEM:\n');
  console.log(`
❌ CURRENT ADMIN API LOGIC:
1. Gets companyId from headers: "biz_YoIIIT73rXwrtK"
2. Finds tenant with whopCompanyId: "biz_YoIIIT73rXwrtK"
3. Returns ALL challenges for that tenant
4. BUT: We have sub-tenants like "biz_YoIIIT73rXwrtK_user_xyz"

🎯 SOLUTION NEEDED:
1. Admin API must identify the USER first
2. Find the user's SUB-TENANT: "biz_YoIIIT73rXwrtK_user_{userId}"
3. Return challenges ONLY from that sub-tenant
  `);
  
  console.log('🧪 TESTING WHAT ADMIN API CURRENTLY RETURNS:\n');
  
  const baseCompanyId = 'biz_YoIIIT73rXwrtK';
  
  // Simulate current admin API logic
  console.log(`🔍 Current API logic: Looking for tenant with companyId "${baseCompanyId}"`);
  
  const currentApiTenant = await prisma.tenant.findUnique({
    where: { whopCompanyId: baseCompanyId },
    include: { challenges: true }
  });
  
  if (currentApiTenant) {
    console.log(`❌ FOUND TENANT: ${currentApiTenant.name}`);
    console.log(`   Challenges: ${currentApiTenant.challenges.length}`);
    currentApiTenant.challenges.forEach(challenge => {
      console.log(`     📝 ${challenge.title}`);
    });
  } else {
    console.log(`✅ NO TENANT FOUND (Good - means sub-tenant isolation working)`);
  }
  
  console.log('\n🔧 WHAT THE FIX SHOULD DO:\n');
  
  // Test with specific user IDs
  const testUsers = ['user_w3lVukX5x9ayO', 'user_eGf5vVjIuGLSy'];
  
  for (const userId of testUsers) {
    const userSubTenantId = `${baseCompanyId}_user_${userId}`;
    console.log(`👤 User: ${userId}`);
    console.log(`🏢 Should use sub-tenant: ${userSubTenantId}`);
    
    const userTenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: userSubTenantId },
      include: { challenges: true }
    });
    
    if (userTenant) {
      console.log(`   ✅ Sub-tenant exists: ${userTenant.name}`);
      console.log(`   Challenges: ${userTenant.challenges.length}`);
      userTenant.challenges.forEach(challenge => {
        console.log(`     📝 ${challenge.title}`);
      });
    } else {
      console.log(`   ❌ Sub-tenant missing!`);
    }
    console.log('');
  }
  
  console.log('🎯 DIAGNOSIS COMPLETE - FIX NEEDED IN ADMIN API!');
}

diagnoseAdminApiProblem()
  .catch(console.error)
  .finally(() => prisma.$disconnect());