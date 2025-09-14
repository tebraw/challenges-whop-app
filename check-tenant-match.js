const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTenants() {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { whopUserId: 'user_4CUq7XKZv98Zy' },
      include: { tenant: true }
    });
    
    console.log('👤 User Info:');
    console.log('WhopUserId:', user?.whopUserId);
    console.log('Role:', user?.role);
    console.log('TenantId:', user?.tenantId);
    console.log('WhopCompanyId:', user?.whopCompanyId);
    console.log('Tenant Name:', user?.tenant?.name);
    console.log('Tenant WhopCompanyId:', user?.tenant?.whopCompanyId);
    
    // Check the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: 'cmfjo1i0600092nh18tcek0cg' },
      include: { tenant: true }
    });
    
    console.log('\n📋 Challenge Info:');
    console.log('TenantId:', challenge?.tenantId);
    console.log('Tenant Name:', challenge?.tenant?.name);
    console.log('Tenant WhopCompanyId:', challenge?.tenant?.whopCompanyId);
    
    console.log('\n🔍 Tenant Match Check:');
    console.log('User Tenant ID matches Challenge Tenant ID:', user?.tenantId === challenge?.tenantId);
    console.log('User WhopCompanyId matches Tenant WhopCompanyId:', user?.whopCompanyId === challenge?.tenant?.whopCompanyId);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenants();