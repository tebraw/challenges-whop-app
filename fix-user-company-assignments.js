// EMERGENCY FIX: Correct User Company ID Assignments
const { PrismaClient } = require('@prisma/client');

async function fixUserCompanyAssignments() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 EMERGENCY FIX: Correcting User Company ID Assignments\n');
    
    // Fix User 1: user_Zv98Zy@whop.com
    // This user should have company ID matching their tenant
    const user1 = await prisma.user.findFirst({
      where: { email: 'user_Zv98Zy@whop.com' },
      include: { tenant: true }
    });
    
    if (user1) {
      console.log(`🔧 Fixing User 1: ${user1.email}`);
      console.log(`   Current whopCompanyId: ${user1.whopCompanyId}`);
      console.log(`   Tenant whopCompanyId: ${user1.tenant?.whopCompanyId}`);
      
      if (user1.whopCompanyId !== user1.tenant?.whopCompanyId) {
        await prisma.user.update({
          where: { id: user1.id },
          data: { whopCompanyId: user1.tenant?.whopCompanyId }
        });
        
        console.log(`   ✅ Updated to: ${user1.tenant?.whopCompanyId}`);
      }
    }
    
    // Check if we need to separate User 2 and User 3
    const user2 = await prisma.user.findFirst({
      where: { email: 'user_w3lVukX5x9ayO@whop.com' }
    });
    
    const user3 = await prisma.user.findFirst({
      where: { email: 'user_IuGLSy@whop.com' }
    });
    
    console.log('\n🔍 CHECKING USER 2 AND 3 SEPARATION:\n');
    
    if (user2 && user3) {
      console.log(`User 2: ${user2.email} - Company: ${user2.whopCompanyId} - Tenant: ${user2.tenantId}`);
      console.log(`User 3: ${user3.email} - Company: ${user3.whopCompanyId} - Tenant: ${user3.tenantId}`);
      
      if (user2.tenantId === user3.tenantId && user2.whopCompanyId === user3.whopCompanyId) {
        console.log('\n🚨 PROBLEM: Users 2 and 3 are in same tenant but should be separate companies!');
        console.log('💡 We need to create a separate tenant for one of them');
        
        // Create new tenant for User 2
        const newTenantId = `company_${user2.whopUserId || 'user2'}`;
        
        const newTenant = await prisma.tenant.create({
          data: {
            name: `Company ${user2.email}`,
            whopCompanyId: newTenantId
          }
        });
        
        console.log(`\n🏗️  Created new tenant for User 2:`);
        console.log(`   Tenant ID: ${newTenant.id}`);
        console.log(`   Company ID: ${newTenant.whopCompanyId}`);
        
        // Move User 2 to new tenant
        await prisma.user.update({
          where: { id: user2.id },
          data: { 
            tenantId: newTenant.id,
            whopCompanyId: newTenant.whopCompanyId
          }
        });
        
        // Move User 2's challenges to new tenant
        await prisma.challenge.updateMany({
          where: { creatorId: user2.id },
          data: { 
            tenantId: newTenant.id,
            whopCompanyId: newTenant.whopCompanyId
          }
        });
        
        console.log(`\n✅ User 2 moved to separate tenant`);
        console.log(`✅ User 2's challenges moved to separate tenant`);
      }
    }
    
    // Verify fix
    console.log('\n🔍 VERIFICATION:\n');
    
    const allUsers = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    allUsers.forEach(user => {
      console.log(`👤 ${user.email}: Company ${user.whopCompanyId} → Tenant ${user.tenant?.whopCompanyId}`);
      
      if (user.whopCompanyId === user.tenant?.whopCompanyId) {
        console.log(`   ✅ Correctly isolated`);
      } else {
        console.log(`   ❌ Still mismatched!`);
      }
    });
    
    // Test isolation
    const tenants = await prisma.tenant.findMany({
      where: { whopCompanyId: { not: null } },
      include: { challenges: true }
    });
    
    console.log('\n📊 TENANT ISOLATION CHECK:\n');
    
    tenants.forEach(tenant => {
      console.log(`🏢 Tenant: ${tenant.whopCompanyId} (${tenant.name})`);
      console.log(`   Challenges: ${tenant.challenges.length}`);
      tenant.challenges.forEach(challenge => {
        console.log(`     - "${challenge.title}"`);
      });
    });
    
  } catch (error) {
    console.error('Error fixing company assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserCompanyAssignments();