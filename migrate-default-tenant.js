// Simple migration: rename default_tenant to proper format

const { PrismaClient } = require('@prisma/client');

async function migrateLegacyTenant() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Migrating legacy default tenant...\n');
    
    // 1. Get the default tenant
    const defaultTenant = await prisma.tenant.findUnique({
      where: { id: 'default_tenant' }
    });
    
    if (!defaultTenant) {
      console.log('✅ No default tenant to migrate');
      return;
    }
    
    console.log(`📋 Default tenant: ${defaultTenant.whopCompanyId}`);
    
    // 2. Create new proper tenant with a safe transaction
    const properTenantId = `tenant_${defaultTenant.whopCompanyId}`;
    
    console.log(`🔄 Step 1: Temporarily clear company ID from default tenant`);
    await prisma.tenant.update({
      where: { id: 'default_tenant' },
      data: { whopCompanyId: null }
    });
    
    console.log(`🔄 Step 2: Create proper tenant: ${properTenantId}`);
    const properTenant = await prisma.tenant.create({
      data: {
        id: properTenantId,
        name: `Company ${defaultTenant.whopCompanyId}`,
        whopCompanyId: defaultTenant.whopCompanyId
      }
    });
    
    console.log(`🔄 Step 3: Migrate challenges`);
    const challengeCount = await prisma.challenge.updateMany({
      where: { tenantId: 'default_tenant' },
      data: { tenantId: properTenantId }
    });
    console.log(`  ✅ Migrated ${challengeCount.count} challenges`);
    
    console.log(`🔄 Step 4: Migrate users`);
    const userCount = await prisma.user.updateMany({
      where: { tenantId: 'default_tenant' },
      data: { tenantId: properTenantId }
    });
    console.log(`  ✅ Migrated ${userCount.count} users`);
    
    console.log(`🔄 Step 5: Delete legacy default tenant`);
    await prisma.tenant.delete({
      where: { id: 'default_tenant' }
    });
    
    console.log('\n✅ Migration complete!');
    console.log(`📊 All data moved to: ${properTenantId}`);
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateLegacyTenant();
