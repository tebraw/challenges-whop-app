// Cleanup Script: Fix orphaned tenants
const { PrismaClient } = require('@prisma/client');

async function cleanupOrphanedTenants() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 CLEANING UP ORPHANED TENANTS...\n');
    
    // Find orphaned tenants
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
    
    console.log(`Found ${orphanedTenants.length} orphaned tenants to clean up`);
    
    for (const tenant of orphanedTenants) {
      console.log(`\n🧽 Processing: ${tenant.name} (${tenant.id})`);
      
      if (tenant.challenges.length === 0 && tenant.users.length === 0) {
        // Safe to delete - no data
        console.log('  ✅ Safe to delete (no data)');
        await prisma.tenant.delete({
          where: { id: tenant.id }
        });
        console.log('  🗑️  Deleted empty tenant');
        
      } else if (tenant.challenges.length === 0 && tenant.users.length > 0) {
        // Has users but no challenges - check if users have valid company data
        console.log(`  👥 Has ${tenant.users.length} users, checking for company context...`);
        
        for (const user of tenant.users) {
          if (user.whopUserId) {
            console.log(`    User ${user.email || user.whopUserId} has Whop ID - keeping for now`);
          }
        }
        
        // For now, just mark as reviewed - manual decision needed
        console.log('  ⚠️  Manual review needed (has users)');
        
      } else {
        // Has challenges - very careful here
        console.log(`  🚨 Has ${tenant.challenges.length} challenges - MANUAL REVIEW REQUIRED`);
        tenant.challenges.forEach(c => {
          console.log(`    - ${c.title}`);
        });
      }
    }
    
    // Summary after cleanup
    console.log('\n📊 POST-CLEANUP SUMMARY:');
    const remainingTenants = await prisma.tenant.findMany({
      include: {
        challenges: {
          select: { id: true }
        }
      }
    });
    
    remainingTenants.forEach(tenant => {
      const status = tenant.whopCompanyId ? '✅' : '❌';
      console.log(`${status} ${tenant.name}`);
      console.log(`    Company: ${tenant.whopCompanyId || 'NONE'}`);
      console.log(`    Challenges: ${tenant.challenges.length}`);
    });
    
    const stillOrphaned = remainingTenants.filter(t => !t.whopCompanyId);
    if (stillOrphaned.length > 0) {
      console.log(`\n⚠️  ${stillOrphaned.length} tenants still need manual review`);
    } else {
      console.log('\n✅ All tenants now have proper company assignments!');
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedTenants();