const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugTenantIssue() {
  console.log('🔍 DEBUGGING TENANT ISOLATION ISSUE');
  console.log('=====================================');
  
  // Get all users
  const users = await prisma.user.findMany({
    include: { tenant: true }
  });
  
  console.log('\n👥 ALL USERS:');
  users.forEach(user => {
    console.log(`- ${user.whopUserId} (${user.email}) -> Tenant: ${user.tenantId} (Company: ${user.tenant?.whopCompanyId || 'none'})`);
  });
  
  // Get all challenges
  const challenges = await prisma.challenge.findMany({
    include: { tenant: true }
  });
  
  console.log('\n🎯 ALL CHALLENGES:');
  challenges.forEach(challenge => {
    console.log(`- ${challenge.title} -> Tenant: ${challenge.tenantId} (Company: ${challenge.tenant?.whopCompanyId || 'none'})`);
  });
  
  // Check for the specific user from logs
  const specificUser = await prisma.user.findUnique({
    where: { whopUserId: 'user_4CUq7XKZv98Zy' },
    include: { tenant: true }
  });
  
  if (specificUser) {
    console.log(`\n🎯 SPECIFIC USER FROM LOGS:`);
    console.log(`- User: ${specificUser.whopUserId}`);
    console.log(`- Tenant: ${specificUser.tenantId}`);
    console.log(`- Company: ${specificUser.tenant?.whopCompanyId || 'none'}`);
    
    const matchingChallenges = challenges.filter(c => c.tenantId === specificUser.tenantId);
    console.log(`- Matching challenges: ${matchingChallenges.length}`);
    matchingChallenges.forEach(c => console.log(`  * ${c.title}`));
  }
  
  await prisma.$disconnect();
}

debugTenantIssue().catch(console.error);