const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTenants() {
  console.log('🔍 Checking existing tenants...\n');
  
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            whopCompanyId: true
          }
        }
      }
    });
    
    console.log('📊 EXISTING TENANTS:');
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (ID: ${tenant.id})`);
      console.log(`   Company ID: ${tenant.whopCompanyId || 'None'}`);
      console.log(`   Challenges: ${tenant.challenges.length}`);
      console.log(`   Users: ${tenant.users.length}`);
      if (tenant.users.length > 0) {
        tenant.users.forEach(user => {
          console.log(`     - ${user.email} (${user.role})`);
        });
      }
      console.log('');
    });
    
    // Return the first tenant with users or the first tenant
    const targetTenant = tenants.find(t => t.users.length > 0) || tenants[0];
    if (targetTenant) {
      console.log(`🎯 RECOMMENDED TENANT: ${targetTenant.name} (${targetTenant.id})`);
      return targetTenant.id;
    } else {
      console.log('❌ No existing tenants found');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error checking tenants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenants();