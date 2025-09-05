// Script to create an admin user for testing
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if we have any tenants first
    let tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      console.log('🏢 Creating default tenant...');
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Organization'
        }
      });
      console.log('✅ Created tenant:', tenant.name);
    }

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('👤 Admin user already exists:', existingAdmin.email);
      console.log('🔑 You can use this account to access /admin');
      return;
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@localhost.com',
        name: 'Admin User',
        role: 'ADMIN',
        tenantId: tenant.id,
        whopUserId: 'admin_whop_123',
        isFreeTier: false,
        subscriptionStatus: 'active',
        tier: 'enterprise'
      }
    });

    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Name:', adminUser.name);
    console.log('🛡️ Role:', adminUser.role);
    console.log('');
    console.log('🚀 You can now access the admin area at: http://localhost:3000/admin');
    console.log('');
    console.log('💡 For development, the system uses a simplified auth flow.');
    console.log('   Just visit /admin and you should be logged in automatically.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
