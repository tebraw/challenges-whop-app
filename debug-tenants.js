// Debug script to see all tenants

const { PrismaClient } = require('@prisma/client');

async function checkAllTenants() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 All tenants in database:\n');
    
    const tenants = await prisma.tenant.findMany({
      include: {
        challenges: true,
        users: true,
        _count: {
          select: {
            challenges: true,
            users: true
          }
        }
      }
    });
    
    tenants.forEach(tenant => {
      console.log(`📋 Tenant: ${tenant.id}`);
      console.log(`  - Name: ${tenant.name}`);
      console.log(`  - Company ID: ${tenant.whopCompanyId}`);
      console.log(`  - Challenges: ${tenant._count.challenges}`);
      console.log(`  - Users: ${tenant._count.users}`);
      console.log(`  - Created: ${tenant.createdAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTenants();
