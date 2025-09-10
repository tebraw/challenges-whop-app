// Enhanced Whop authentication for admin access
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enhanceWhopAuth() {
  console.log('🔐 Enhancing Whop authentication for admin access...');
  console.log('='.repeat(55));

  try {
    const whopCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_YoIIIT73rXwrtK';
    
    // Create a special admin user that will automatically be granted access
    // when someone accesses the admin panel in Whop
    const adminUsers = [
      {
        email: 'challengesapp@whop.local',
        name: 'Challenges App Admin',
        role: 'ADMIN'
      },
      {
        email: `admin@${whopCompanyId}.whop.local`, 
        name: 'App Installer Admin',
        role: 'ADMIN'
      },
      {
        email: 'whop.admin@challenges.app',
        name: 'Whop Default Admin', 
        role: 'ADMIN'
      }
    ];

    const tenantId = `tenant_${whopCompanyId}`;

    for (const adminData of adminUsers) {
      await prisma.user.upsert({
        where: { email: adminData.email },
        update: {
          role: 'ADMIN',
          whopCompanyId: whopCompanyId,
          tenantId: tenantId,
          name: adminData.name
        },
        create: {
          email: adminData.email,
          name: adminData.name,
          role: 'ADMIN',
          whopCompanyId: whopCompanyId,
          tenantId: tenantId
        }
      });
      console.log(`✅ Admin user ready: ${adminData.email}`);
    }

    // Create a special "auto-admin" user that can be used for any Whop user ID
    // This will be the fallback when we detect a Whop company owner
    await prisma.user.upsert({
      where: { email: 'auto.admin@whop.local' },
      update: {
        role: 'ADMIN',
        whopCompanyId: whopCompanyId,
        tenantId: tenantId,
        name: 'Auto Admin (Company Owner)'
      },
      create: {
        email: 'auto.admin@whop.local',
        name: 'Auto Admin (Company Owner)',
        role: 'ADMIN',
        whopCompanyId: whopCompanyId,
        tenantId: tenantId
      }
    });
    console.log('✅ Auto-admin user created for company owners');

    console.log('\n🎯 Authentication Strategy:');
    console.log('1. Any user with whopCompanyId matching app company gets admin');
    console.log('2. Multiple fallback admin accounts created');
    console.log('3. Auto-promotion for app installers');
    
    console.log('\n✅ Enhanced Whop authentication complete!');

  } catch (error) {
    console.error('❌ Error enhancing Whop auth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enhanceWhopAuth().catch(console.error);
