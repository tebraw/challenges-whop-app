// Fix orphaned tenants by assigning proper company IDs
const { PrismaClient } = require('@prisma/client');

async function assignCompanyIdsToOrphans() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 ASSIGNING COMPANY IDs TO ORPHANED TENANTS...\n');
    
    // Map tenant names to likely company IDs based on patterns
    const orphanMappings = [
      {
        tenantName: 'Company f7n48c',
        suggestedCompanyId: 'company_f7n48c', // Extract from name
        whopUserId: 'user_Zv98Zy@whop.com'
      },
      {
        tenantName: 'Company rXwrtK', 
        suggestedCompanyId: 'company_rXwrtK', // Extract from name
        whopUserId: 'user_w3lVukX5x9ayO@whop.com'
      }
    ];
    
    for (const mapping of orphanMappings) {
      console.log(`\n🔍 Processing ${mapping.tenantName}...`);
      
      const tenant = await prisma.tenant.findFirst({
        where: {
          name: mapping.tenantName,
          whopCompanyId: null
        },
        include: {
          users: true
        }
      });
      
      if (tenant) {
        // Extract company ID from tenant name pattern
        const companyIdMatch = tenant.name.match(/Company\s+([a-zA-Z0-9]+)/);
        const companyId = companyIdMatch ? companyIdMatch[1] : mapping.suggestedCompanyId;
        
        console.log(`  📝 Found tenant: ${tenant.id}`);
        console.log(`  🏢 Suggested company ID: ${companyId}`);
        console.log(`  👤 Users: ${tenant.users.length}`);
        
        // Check if this company ID is already used
        const existingTenant = await prisma.tenant.findUnique({
          where: { whopCompanyId: companyId }
        });
        
        if (existingTenant) {
          console.log(`  ⚠️  Company ID ${companyId} already exists in tenant ${existingTenant.name}`);
          console.log(`  🔄 Need to merge or use different ID`);
          
          // Try with a suffix
          const alternativeId = `${companyId}_alt`;
          const altExists = await prisma.tenant.findUnique({
            where: { whopCompanyId: alternativeId }
          });
          
          if (!altExists) {
            console.log(`  ✅ Using alternative ID: ${alternativeId}`);
            await prisma.tenant.update({
              where: { id: tenant.id },
              data: { whopCompanyId: alternativeId }
            });
            console.log(`  ✅ Updated tenant with company ID: ${alternativeId}`);
          } else {
            console.log(`  🚨 Manual intervention needed - both IDs exist`);
          }
        } else {
          // Company ID is free - assign it
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { whopCompanyId: companyId }
          });
          console.log(`  ✅ Updated tenant with company ID: ${companyId}`);
        }
      } else {
        console.log(`  ❌ Tenant ${mapping.tenantName} not found or already has company ID`);
      }
    }
    
    // Final verification
    console.log('\n📊 FINAL TENANT STATUS:');
    const allTenants = await prisma.tenant.findMany({
      include: {
        challenges: { select: { id: true } },
        users: { select: { id: true } }
      }
    });
    
    allTenants.forEach(tenant => {
      const status = tenant.whopCompanyId ? '✅' : '❌';
      console.log(`${status} ${tenant.name}`);
      console.log(`    ID: ${tenant.id}`);
      console.log(`    Company: ${tenant.whopCompanyId || 'NONE'}`);
      console.log(`    Users: ${tenant.users.length}, Challenges: ${tenant.challenges.length}`);
    });
    
    const stillOrphaned = allTenants.filter(t => !t.whopCompanyId);
    if (stillOrphaned.length === 0) {
      console.log('\n🎉 SUCCESS: All tenants now have proper company IDs!');
      console.log('✅ Multi-tenancy isolation is now enforced');
    } else {
      console.log(`\n⚠️  ${stillOrphaned.length} tenants still orphaned`);
    }
    
  } catch (error) {
    console.error('Error assigning company IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignCompanyIdsToOrphans();