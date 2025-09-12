// Cleanup script to migrate legacy "default_tenant" data to proper company-specific tenants

const { PrismaClient } = require('@prisma/client');

async function cleanupLegacyTenants() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 Cleaning up legacy tenant data...\n');
    
    // 1. Find the default tenant
    const defaultTenant = await prisma.tenant.findUnique({
      where: { id: 'default_tenant' },
      include: {
        challenges: true,
        users: true
      }
    });
    
    if (!defaultTenant) {
      console.log('✅ No default tenant found - already clean!');
      return;
    }
    
    console.log(`📋 Found legacy default tenant:`);
    console.log(`  - Company ID: ${defaultTenant.whopCompanyId}`);
    console.log(`  - Challenges: ${defaultTenant.challenges.length}`);
    console.log(`  - Users: ${defaultTenant.users.length}\n`);
    
    if (defaultTenant.whopCompanyId) {
      // 2. Find existing tenant with this company ID (might have different format)
      console.log(`🔍 Looking for tenant with company ID: ${defaultTenant.whopCompanyId}`);
      
      let properTenant = await prisma.tenant.findFirst({
        where: { 
          whopCompanyId: defaultTenant.whopCompanyId,
          id: { not: 'default_tenant' }
        }
      });
      
      if (!properTenant) {
        // Create the proper tenant
        const properTenantId = `tenant_${defaultTenant.whopCompanyId}`;
        console.log(`🔄 Creating proper tenant: ${properTenantId}`);
        
        properTenant = await prisma.tenant.create({
          data: {
            id: properTenantId,
            name: `Company ${defaultTenant.whopCompanyId}`,
            whopCompanyId: defaultTenant.whopCompanyId
          }
        });
      } else {
        console.log(`✅ Found existing proper tenant: ${properTenant.id}`);
      }
      
      // 3. Migrate challenges
      if (defaultTenant.challenges.length > 0) {
        console.log(`📦 Migrating ${defaultTenant.challenges.length} challenges...`);
        
        for (const challenge of defaultTenant.challenges) {
          await prisma.challenge.update({
            where: { id: challenge.id },
            data: { tenantId: properTenant.id }
          });
          console.log(`  ✅ Migrated challenge: ${challenge.title}`);
        }
      }
      
      // 4. Migrate users
      if (defaultTenant.users.length > 0) {
        console.log(`👥 Migrating ${defaultTenant.users.length} users...`);
        
        for (const user of defaultTenant.users) {
          await prisma.user.update({
            where: { id: user.id },
            data: { tenantId: properTenant.id }
          });
          console.log(`  ✅ Migrated user: ${user.email}`);
        }
      }
      
      // 5. Delete the legacy default tenant
      console.log(`🗑️ Removing legacy default tenant...`);
      await prisma.tenant.delete({
        where: { id: 'default_tenant' }
      });
      
      console.log('\n✅ Legacy tenant cleanup complete!');
      console.log(`📊 All data migrated to proper tenant: ${properTenant.id}`);
      
    } else {
      console.log('⚠️ Default tenant has no company ID - manual review needed');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupLegacyTenants();
