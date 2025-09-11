const { PrismaClient } = require('@prisma/client');

async function fixAdminAccess() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing admin access for recent user...\n');
    
    // Find the problematic user
    const problemUser = await prisma.user.findFirst({
      where: { 
        whopUserId: 'user_w3lVukX5x9ayO'
      },
      include: { tenant: true }
    });
    
    if (!problemUser) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 Found user:', {
      name: problemUser.name,
      email: problemUser.email,
      currentRole: problemUser.role,
      whopCompanyId: problemUser.whopCompanyId,
      currentTenant: problemUser.tenant?.name
    });
    
    // Check if user should have admin access
    if (problemUser.whopCompanyId) {
      console.log('✅ User has company ID - should be admin');
      
      // Find the correct tenant (ChallengesAPP)
      const correctTenant = await prisma.tenant.findFirst({
        where: { 
          whopCompanyId: problemUser.whopCompanyId 
        }
      });
      
      if (correctTenant) {
        console.log(`🏢 Found correct tenant: ${correctTenant.name}`);
        
        // Update user to admin with correct tenant
        const updatedUser = await prisma.user.update({
          where: { id: problemUser.id },
          data: {
            role: 'ADMIN',
            tenantId: correctTenant.id,
            isFreeTier: false,
            tier: 'enterprise'
          }
        });
        
        console.log('✅ User updated successfully:');
        console.log(`   Role: ${problemUser.role} → ${updatedUser.role}`);
        console.log(`   Tenant: ${problemUser.tenant?.name} → ${correctTenant.name}`);
        console.log(`   Tier: ${problemUser.tier} → ${updatedUser.tier}`);
        
        console.log('\n🎉 ADMIN ACCESS FIXED!');
        console.log('User should now have admin access to create challenges.');
        
      } else {
        console.log('❌ No tenant found for company ID:', problemUser.whopCompanyId);
      }
    } else {
      console.log('❌ User has no company ID - cannot grant admin access');
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminAccess();