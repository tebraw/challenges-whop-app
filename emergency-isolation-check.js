// EMERGENCY DEBUG: Check current isolation status
// Verify if users can still see each other's challenges

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function emergencyIsolationCheck() {
  console.log('🚨 EMERGENCY ISOLATION CHECK\n');
  
  console.log('📊 CURRENT DATABASE STATE:\n');
  
  // Check all users and their challenges
  const allUsers = await prisma.user.findMany({
    include: {
      tenant: {
        include: {
          challenges: true
        }
      }
    }
  });
  
  console.log(`👥 Total Users: ${allUsers.length}\n`);
  
  for (const user of allUsers) {
    console.log(`👤 USER: ${user.email}`);
    console.log(`   User ID: ${user.whopUserId}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Company ID: ${user.whopCompanyId}`);
    console.log(`   Tenant: ${user.tenant?.name || 'NONE'}`);
    console.log(`   Tenant ID: ${user.tenant?.id || 'NONE'}`);
    console.log(`   Challenges in Tenant: ${user.tenant?.challenges.length || 0}`);
    
    if (user.tenant?.challenges.length > 0) {
      user.tenant.challenges.forEach(challenge => {
        console.log(`     📝 ${challenge.title} (created: ${challenge.createdAt})`);
      });
    }
    console.log('');
  }
  
  console.log('🔍 CHALLENGE OWNERSHIP ANALYSIS:\n');
  
  // Check all challenges and their ownership
  const allChallenges = await prisma.challenge.findMany({
    include: {
      tenant: true,
      creator: true
    }
  });
  
  console.log(`📝 Total Challenges: ${allChallenges.length}\n`);
  
  for (const challenge of allChallenges) {
    console.log(`📝 CHALLENGE: ${challenge.title}`);
    console.log(`   Challenge ID: ${challenge.id}`);
    console.log(`   Tenant: ${challenge.tenant?.name || 'NONE'}`);
    console.log(`   Tenant Company ID: ${challenge.tenant?.whopCompanyId || 'NONE'}`);
    console.log(`   Challenge Company ID: ${challenge.whopCompanyId || 'NONE'}`);
    console.log(`   Creator: ${challenge.creator?.email || 'NONE'}`);
    console.log(`   Creator ID: ${challenge.creatorId || 'NONE'}`);
    console.log('');
  }
  
  console.log('🔒 ISOLATION VERIFICATION:\n');
  
  // Check for potential cross-contamination
  const tenantGroups = {};
  
  for (const user of allUsers) {
    const companyId = user.whopCompanyId;
    if (!tenantGroups[companyId]) {
      tenantGroups[companyId] = [];
    }
    tenantGroups[companyId].push(user);
  }
  
  for (const [companyId, users] of Object.entries(tenantGroups)) {
    console.log(`🏢 Company ID: ${companyId}`);
    console.log(`   Users: ${users.length}`);
    
    if (users.length > 1) {
      console.log(`   ⚠️ POTENTIAL ISSUE: Multiple users in same company!`);
      users.forEach(user => {
        console.log(`     👤 ${user.email} (${user.tenant?.challenges.length || 0} challenges)`);
      });
    } else {
      console.log(`   ✅ Proper isolation: Single user`);
    }
    console.log('');
  }
  
  // Check API challenge fetch simulation
  console.log('🧪 API CHALLENGE FETCH SIMULATION:\n');
  
  for (const user of allUsers) {
    console.log(`👤 Simulating API call for: ${user.email}`);
    
    // Simulate what the API would return for this user
    const userChallenges = await prisma.challenge.findMany({
      where: {
        AND: [
          { tenantId: user.tenantId },
          { whopCompanyId: user.whopCompanyId }
        ]
      },
      include: {
        tenant: true
      }
    });
    
    console.log(`   API would return: ${userChallenges.length} challenges`);
    userChallenges.forEach(challenge => {
      console.log(`     📝 ${challenge.title}`);
    });
    console.log('');
  }
  
  console.log('🎯 DIAGNOSIS COMPLETE!');
}

emergencyIsolationCheck()
  .catch(console.error)
  .finally(() => prisma.$disconnect());