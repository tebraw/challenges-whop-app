const { PrismaClient } = require('@prisma/client');

async function checkAdminAccess() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking admin access issue...\n');
    
    // 1. Check all users and their roles
    const users = await prisma.user.findMany({
      include: {
        tenant: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('👥 All Users in Database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Whop User ID: ${user.whopUserId || 'None'}`);
      console.log(`   Whop Company ID: ${user.whopCompanyId || 'None'}`);
      console.log(`   Tenant: ${user.tenant?.name || 'None'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
    // 2. Check tenants
    const tenants = await prisma.tenant.findMany();
    console.log('🏢 All Tenants:');
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}`);
      console.log(`   Company ID: ${tenant.whopCompanyId || 'None'}`);
      console.log(`   Created: ${tenant.createdAt}`);
      console.log('');
    });
    
    // 3. Check most recent user (the one with issues)
    const recentUser = users[0];
    if (recentUser) {
      console.log('🔍 Most Recent User Analysis:');
      console.log(`   Name: ${recentUser.name}`);
      console.log(`   Email: ${recentUser.email}`);
      console.log(`   Current Role: ${recentUser.role}`);
      console.log(`   Should be Admin?: ${recentUser.whopCompanyId ? 'YES (has company)' : 'NO (no company)'}`);
      
      if (recentUser.role === 'USER' && recentUser.whopCompanyId) {
        console.log('⚠️ ISSUE FOUND: User has company but role is USER instead of ADMIN');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminAccess();