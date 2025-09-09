const { PrismaClient } = require('@prisma/client');

async function checkDefaultTenant() {
  const prisma = new PrismaClient();
  
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { name: 'Default Tenant' }
    });
    
    console.log('Default Tenant:', JSON.stringify(tenant, null, 2));
    
    // Auch alle Tenants anzeigen
    const allTenants = await prisma.tenant.findMany();
    console.log('\nAlle Tenants:');
    allTenants.forEach(t => {
      console.log(`- ${t.name}: whopCompanyId = ${t.whopCompanyId}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDefaultTenant();
