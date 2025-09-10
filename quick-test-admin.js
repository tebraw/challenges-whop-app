// quick-test-admin.js - Quick admin access test
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickAdminTest() {
  console.log('🔍 Quick Admin Access Test');
  console.log('='.repeat(30));

  const companyId = 'biz_YoIIIT73rXwrtK';
  const userId = 'user_Z9GOqqGEJWyjG'; // Your agent user

  // Check if admin user exists
  const adminUser = await prisma.user.findFirst({
    where: {
      whopUserId: userId,
      whopCompanyId: companyId,
      role: 'ADMIN'
    }
  });

  if (adminUser) {
    console.log('✅ ADMIN USER FOUND:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Company: ${adminUser.whopCompanyId}`);
    console.log('');
    console.log('🎯 AS COMPANY OWNER YOU GET ADMIN ACCESS IMMEDIATELY');
    console.log('   → No subscription needed');
    console.log('   → Direct iframe access');
    console.log('   → Admin dashboard available');
  } else {
    console.log('❌ No admin user found - creating one...');
    
    let tenant = await prisma.tenant.findFirst({
      where: { name: `Company ${companyId.slice(-6)}` }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: `Company ${companyId.slice(-6)}` }
      });
    }

    const newAdmin = await prisma.user.create({
      data: {
        email: `owner_${userId.slice(-6)}@whop.com`,
        name: `Company Owner`,
        role: 'ADMIN',
        whopUserId: userId,
        whopCompanyId: companyId,
        tenantId: tenant.id
      }
    });

    console.log('✅ CREATED ADMIN USER:', newAdmin.email);
  }

  await prisma.$disconnect();
}

quickAdminTest().catch(console.error);
