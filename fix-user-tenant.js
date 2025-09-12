// Fix user in wrong tenant
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserTenant() {
  try {
    console.log('🔧 Fixing user tenant assignment...\n');
    
    // Find the misplaced user
    const user = await prisma.user.findUnique({
      where: { email: 'user_5x9ayO@whop.com' },
      include: { tenant: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 Found user:', user.email);
    console.log('Current tenant:', user.tenant.name, '(ID:', user.tenantId, ')');
    console.log('User company ID:', user.whopCompanyId);
    
    // Find the correct tenant based on company ID
    const correctTenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: user.whopCompanyId }
    });
    
    if (!correctTenant) {
      console.log('❌ No tenant found with matching company ID');
      return;
    }
    
    console.log('✅ Found correct tenant:', correctTenant.name, '(ID:', correctTenant.id, ')');
    
    if (user.tenantId === correctTenant.id) {
      console.log('✅ User is already in correct tenant');
      return;
    }
    
    // Move user to correct tenant
    console.log('🔄 Moving user to correct tenant...');
    
    await prisma.user.update({
      where: { id: user.id },
      data: { tenantId: correctTenant.id }
    });
    
    console.log('✅ User successfully moved to correct tenant!');
    
    // Verify the fix
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tenant: true }
    });
    
    console.log('\n🔍 Verification:');
    console.log('User tenant:', updatedUser.tenant.name);
    console.log('User company ID:', updatedUser.whopCompanyId);
    console.log('Tenant company ID:', updatedUser.tenant.whopCompanyId);
    
    if (updatedUser.whopCompanyId === updatedUser.tenant.whopCompanyId) {
      console.log('✅ FIXED: User is now in the correct tenant!');
    } else {
      console.log('❌ ERROR: User is still in wrong tenant!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing user tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserTenant();