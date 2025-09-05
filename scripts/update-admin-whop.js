// Script to update admin user with real Whop account details
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminWithWhopAccount() {
  try {
    // Find or create tenant
    let tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Organization'
        }
      });
    }

    // Delete existing admin if exists
    await prisma.user.deleteMany({
      where: { 
        OR: [
          { email: 'admin@localhost.com' },
          { whopUserId: 'user_11HQI5KrNDW1S' }
        ]
      }
    });

    // Create admin user with your real Whop account
    const adminUser = await prisma.user.create({
      data: {
        email: 'challenges-agentd1@whop.com',
        name: 'Challenges Agent',
        role: 'ADMIN',
        tenantId: tenant.id,
        whopUserId: 'user_11HQI5KrNDW1S',
        whopCompanyId: 'comp_challenges_agentd1', // This is required for admin access
        isFreeTier: false,
        subscriptionStatus: 'active',
        tier: 'enterprise'
      }
    });

    console.log('🎉 Admin user updated with your Whop account!');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Name:', adminUser.name);
    console.log('🛡️ Role:', adminUser.role);
    console.log('🔗 Whop User ID:', adminUser.whopUserId);
    console.log('🏢 Whop Company ID:', adminUser.whopCompanyId);
    console.log('');
    console.log('🚀 You can now access: http://localhost:3000/admin');

  } catch (error) {
    console.error('❌ Error updating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminWithWhopAccount();
