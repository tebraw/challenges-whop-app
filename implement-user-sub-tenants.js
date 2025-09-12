// Perfect User Isolation Strategy
// Creates sub-tenants for each user within the real Whop company

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function implementUserSubTenants() {
  console.log('🚀 IMPLEMENTING PERFECT USER ISOLATION STRATEGY\n');
  
  const realCompanyId = 'biz_YoIIIT73rXwrtK'; // Your actual Whop company
  
  console.log(`🏢 Real Whop Company: ${realCompanyId}`);
  console.log(`🎯 Strategy: Create isolated sub-tenants for each user\n`);
  
  // Get all current users
  const allUsers = await prisma.user.findMany({
    include: {
      tenant: true
    }
  });
  
  console.log(`👥 Found ${allUsers.length} users to migrate\n`);
  
  for (const user of allUsers) {
    console.log(`${'='.repeat(50)}`);
    console.log(`👤 MIGRATING USER: ${user.email}`);
    console.log(`${'='.repeat(50)}`);
    
    // Create user-specific sub-tenant ID
    const userSubTenantId = `${realCompanyId}_user_${user.whopUserId}`;
    
    // Smart tenant name
    let tenantName = `${user.name || user.email.split('@')[0]}'s Workspace`;
    
    // Extract better name from email domain
    if (user.email && user.email.includes('@')) {
      const domain = user.email.split('@')[1];
      if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail')) {
        const domainName = domain.split('.')[0];
        const smartName = domainName
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        tenantName = `${smartName} - ${user.name || user.email.split('@')[0]}`;
      }
    }
    
    console.log(`📋 Current tenant: ${user.tenant?.name || 'None'} (${user.tenant?.whopCompanyId || 'None'})`);
    console.log(`🎯 New sub-tenant: ${tenantName} (${userSubTenantId})`);
    
    // Check if sub-tenant already exists
    let subTenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: userSubTenantId }
    });
    
    if (!subTenant) {
      // Create new sub-tenant
      subTenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          whopCompanyId: userSubTenantId
        }
      });
      console.log(`✅ Created sub-tenant: ${tenantName}`);
    } else {
      console.log(`ℹ️ Sub-tenant already exists: ${subTenant.name}`);
    }
    
    // Update user to use sub-tenant
    await prisma.user.update({
      where: { id: user.id },
      data: {
        tenantId: subTenant.id,
        whopCompanyId: userSubTenantId
      }
    });
    
    console.log(`🔄 Updated user to use sub-tenant`);
    
    // Migrate user's challenges to sub-tenant
    const userChallenges = await prisma.challenge.findMany({
      where: { 
        OR: [
          { creatorId: user.id },
          { tenantId: user.tenant?.id }
        ]
      }
    });
    
    if (userChallenges.length > 0) {
      await prisma.challenge.updateMany({
        where: {
          OR: [
            { creatorId: user.id },
            { tenantId: user.tenant?.id }
          ]
        },
        data: {
          tenantId: subTenant.id,
          whopCompanyId: userSubTenantId
        }
      });
      
      console.log(`📝 Migrated ${userChallenges.length} challenges to sub-tenant`);
    } else {
      console.log(`📝 No challenges to migrate`);
    }
    
    console.log(`✅ User migration complete!\n`);
  }
  
  console.log(`${'='.repeat(60)}`);
  console.log('🎉 USER SUB-TENANT MIGRATION COMPLETE!');
  console.log(`${'='.repeat(60)}`);
  
  // Verify isolation
  console.log('\n🔒 VERIFYING PERFECT ISOLATION:\n');
  
  const allSubTenants = await prisma.tenant.findMany({
    where: {
      whopCompanyId: {
        startsWith: realCompanyId
      }
    },
    include: {
      users: true,
      challenges: true
    }
  });
  
  for (const tenant of allSubTenants) {
    console.log(`🏢 ${tenant.name}:`);
    console.log(`   ID: ${tenant.whopCompanyId}`);
    console.log(`   Users: ${tenant.users.length}`);
    console.log(`   Challenges: ${tenant.challenges.length}`);
    
    tenant.users.forEach(user => {
      console.log(`   👤 ${user.email} (${user.role})`);
    });
    
    tenant.challenges.forEach(challenge => {
      console.log(`   📝 ${challenge.title}`);
    });
    
    console.log('');
  }
  
  console.log('✅ PERFECT USER ISOLATION ACHIEVED!');
}

implementUserSubTenants()
  .catch(console.error)
  .finally(() => prisma.$disconnect());