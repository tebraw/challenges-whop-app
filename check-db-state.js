const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Current Database State after App Installation:\n');
  
  // Check users
  const users = await prisma.user.findMany({
    include: {
      tenant: true
    }
  });
  
  console.log('👥 USERS:');
  console.log(`Count: ${users.length}\n`);
  users.forEach(user => {
    console.log(`- Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  WhopUserId: ${user.whopUserId || 'NULL'}`);
    console.log(`  WhopCompanyId: ${user.whopCompanyId || 'NULL'}`);
    console.log(`  ExperienceId: ${user.experienceId || 'NULL'}`);
    console.log(`  TenantId: ${user.tenantId}`);
    console.log(`  Tenant Name: ${user.tenant?.name || 'NULL'}`);
    console.log('');
  });
  
  // Check tenants
  const tenants = await prisma.tenant.findMany({
    include: {
      challenges: true,
      users: true
    }
  });
  
  console.log('🏢 TENANTS:');
  console.log(`Count: ${tenants.length}\n`);
  tenants.forEach(tenant => {
    console.log(`- Name: ${tenant.name}`);
    console.log(`  ID: ${tenant.id}`);
    console.log(`  WhopCompanyId: ${tenant.whopCompanyId || 'NULL'}`);
    console.log(`  Users: ${tenant.users.length}`);
    console.log(`  Challenges: ${tenant.challenges.length}`);
    console.log('');
  });
  
  // Check challenges
  const challenges = await prisma.challenge.findMany({
    include: {
      tenant: true,
      creator: true
    }
  });
  
  console.log('📝 CHALLENGES:');
  console.log(`Count: ${challenges.length}\n`);
  challenges.forEach(challenge => {
    console.log(`- Title: ${challenge.title}`);
    console.log(`  ID: ${challenge.id}`);
    console.log(`  TenantId: ${challenge.tenantId}`);
    console.log(`  WhopCompanyId: ${challenge.whopCompanyId || 'NULL'}`);
    console.log(`  ExperienceId: ${challenge.experienceId || 'NULL'}`);
    console.log(`  Creator: ${challenge.creator?.email || 'NULL'}`);
    console.log(`  Tenant: ${challenge.tenant?.name || 'NULL'}`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

checkDatabase().catch(console.error);