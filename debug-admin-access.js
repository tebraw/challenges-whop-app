const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAdminAccess() {
  console.log('🔍 Database Debug - Admin Access Check');
  console.log('='.repeat(50));

  try {
    // 1. Check all users
    const users = await prisma.user.findMany({
      include: {
        tenant: true
      }
    });
    console.log('\n👥 All Users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Whop Company ID: ${user.whopCompanyId}`);
      console.log(`  Tenant ID: ${user.tenantId}`);
      console.log(`  Tenant: ${user.tenant?.name || 'None'}`);
      console.log('');
    });

    // 2. Check all tenants
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            challenges: true
          }
        }
      }
    });
    console.log('\n🏢 All Tenants:');
    tenants.forEach(tenant => {
      console.log(`- ID: ${tenant.id}`);
      console.log(`  Name: ${tenant.name}`);
      console.log(`  Whop Company ID: ${tenant.whopCompanyId}`);
      console.log(`  Users: ${tenant._count.users}`);
      console.log(`  Challenges: ${tenant._count.challenges}`);
      console.log('');
    });

    // 3. Check challenges
    const challenges = await prisma.challenge.findMany({
      include: {
        tenant: true,
        creator: true,
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });
    console.log('\n🎯 All Challenges:');
    challenges.forEach(challenge => {
      console.log(`- ID: ${challenge.id}`);
      console.log(`  Title: ${challenge.title}`);
      console.log(`  Tenant: ${challenge.tenant?.name || 'None'}`);
      console.log(`  Creator: ${challenge.creator?.email || 'None'}`);
      console.log(`  Enrollments: ${challenge._count.enrollments}`);
      console.log('');
    });

    // 4. Check for the expected admin user
    const expectedAdmin = await prisma.user.findFirst({
      where: {
        email: 'challengesapp@whop.local'
      },
      include: {
        tenant: true
      }
    });

    console.log('\n🔑 Expected Admin User:');
    if (expectedAdmin) {
      console.log(`✅ Found: ${expectedAdmin.email}`);
      console.log(`   Role: ${expectedAdmin.role}`);
      console.log(`   Whop Company ID: ${expectedAdmin.whopCompanyId}`);
      console.log(`   Tenant: ${expectedAdmin.tenant?.name || 'None'}`);
    } else {
      console.log('❌ Expected admin user not found!');
    }

    // 5. Check for expected tenant
    const expectedTenant = await prisma.tenant.findFirst({
      where: {
        whopCompanyId: '9nmw5yleoqldrxf7n48c'
      }
    });

    console.log('\n🏢 Expected Tenant:');
    if (expectedTenant) {
      console.log(`✅ Found: ${expectedTenant.name}`);
      console.log(`   ID: ${expectedTenant.id}`);
      console.log(`   Whop Company ID: ${expectedTenant.whopCompanyId}`);
    } else {
      console.log('❌ Expected tenant not found!');
    }

  } catch (error) {
    console.error('❌ Database Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminAccess().catch(console.error);
