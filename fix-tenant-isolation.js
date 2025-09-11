// Fix Script: Clean up orphaned tenants and ensure proper isolation
const { PrismaClient } = require('@prisma/client');

async function fixTenantIsolation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 FIXING TENANT ISOLATION ISSUES...\n');
    
    // 1. Find orphaned tenants (no company ID)
    const orphanedTenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { whopCompanyId: null },
          { whopCompanyId: '' }
        ]
      },
      include: {
        challenges: true,
        users: true
      }
    });
    
    console.log(`Found ${orphanedTenants.length} orphaned tenants`);
    
    for (const tenant of orphanedTenants) {
      console.log(`\n🚨 Orphaned Tenant: ${tenant.name} (${tenant.id})`);
      console.log(`  - Challenges: ${tenant.challenges.length}`);
      console.log(`  - Users: ${tenant.users.length}`);
      
      if (tenant.challenges.length > 0) {
        console.log('  ⚠️  This tenant has challenges! Manual review needed.');
        tenant.challenges.forEach(c => {
          console.log(`    - ${c.title} (Created: ${c.createdAt})`);
        });
      }
      
      if (tenant.users.length > 0) {
        console.log('  ⚠️  This tenant has users! Manual review needed.');
        tenant.users.forEach(u => {
          console.log(`    - ${u.email || u.name || u.id}`);
        });
      }
      
      // For now, just log - don't delete automatically
      console.log(`  💡 Recommend: Review and either assign company or delete`);
    }
    
    // 2. Check all tenants and their company assignments
    console.log('\n📊 ALL TENANTS OVERVIEW:');
    const allTenants = await prisma.tenant.findMany({
      include: {
        challenges: {
          select: { id: true, title: true }
        }
      }
    });
    
    allTenants.forEach(tenant => {
      const status = tenant.whopCompanyId ? '✅' : '❌';
      console.log(`${status} ${tenant.name} (${tenant.id})`);
      console.log(`    Company: ${tenant.whopCompanyId || 'NONE'}`);
      console.log(`    Challenges: ${tenant.challenges.length}`);
    });
    
    // 3. Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (orphanedTenants.length > 0) {
      console.log('1. Clean up orphaned tenants:');
      orphanedTenants.forEach(tenant => {
        if (tenant.challenges.length === 0 && tenant.users.length === 0) {
          console.log(`   DELETE: ${tenant.name} (empty tenant)`);
        } else {
          console.log(`   REVIEW: ${tenant.name} (has data)`);
        }
      });
    }
    
    console.log('2. Ensure admin API validation:');
    console.log('   - Always check companyId is not null/empty');
    console.log('   - Reject requests without valid company context');
    
    console.log('3. Add unique constraint check:');
    console.log('   - Prevent duplicate company tenants');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTenantIsolation();