#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function cleanupOldUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 CLEANING UP ALL OLD FALLBACK USERS\n');
    
    // Delete all users with fallback company ID
    const deleteResult = await prisma.user.deleteMany({
      where: { whopCompanyId: '9nmw5yleoqldrxf7n48c' }
    });
    
    console.log(`✅ Deleted ${deleteResult.count} users with fallback company ID`);
    
    // Delete all tenants with fallback company ID
    const deleteTenantResult = await prisma.tenant.deleteMany({
      where: { whopCompanyId: '9nmw5yleoqldrxf7n48c' }
    });
    
    console.log(`✅ Deleted ${deleteTenantResult.count} tenants with fallback company ID`);
    
    // Delete experience tenants too
    const deleteExpTenantResult = await prisma.tenant.deleteMany({
      where: { whopCompanyId: { startsWith: 'experience_' } }
    });
    
    console.log(`✅ Deleted ${deleteExpTenantResult.count} experience tenants`);
    
    // Show final state
    console.log('\n📊 FINAL DATABASE STATE:');
    const allUsers = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    console.log(`Users remaining: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`   - ${user.email}: Company ${user.whopCompanyId}, Role ${user.role}`);
    });
    
    const allTenants = await prisma.tenant.findMany({
      include: { users: true }
    });
    
    console.log(`Tenants remaining: ${allTenants.length}`);
    allTenants.forEach(tenant => {
      console.log(`   - ${tenant.name}: ${tenant.whopCompanyId} (${tenant.users.length} users)`);
    });
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Deploy the app to production');
    console.log('2. Tell colleague to clear browser cache');
    console.log('3. Colleague should reinstall/reopen the app');
    console.log('4. He will get proper company ID and admin access');
    
  } catch (error) {
    console.error('❌ Error cleaning up:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldUsers();