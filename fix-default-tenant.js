const { PrismaClient } = require('@prisma/client');

async function fixDefaultTenant() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Fixing Default Tenant whopCompanyId...');
    
    const updated = await prisma.tenant.update({
      where: { id: 'default_tenant' },
      data: { whopCompanyId: null }
    });
    
    console.log('Updated Default Tenant:', JSON.stringify(updated, null, 2));
    console.log('✅ Default Tenant is now free to access (no Whop community required)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDefaultTenant();
