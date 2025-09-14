const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            challenges: true,
            users: true
          }
        }
      }
    });
    console.log('🏢 ALLE TENANTS im System:');
    tenants.forEach(tenant => {
      console.log(`- Tenant: ${tenant.name}`);
      console.log(`  Company ID: ${tenant.whopCompanyId}`);
      console.log(`  Challenges: ${tenant._count.challenges}`);
      console.log(`  Users: ${tenant._count.users}`);
      console.log('');
    });
    
    const challenges = await prisma.challenge.findMany({
      include: {
        tenant: true
      }
    });
    console.log('🎯 ALLE CHALLENGES und ihre Tenants:');
    challenges.forEach(challenge => {
      console.log(`- Challenge: ${challenge.title}`);
      console.log(`  Tenant: ${challenge.tenant.name} (Company: ${challenge.tenant.whopCompanyId})`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}
checkTenants();