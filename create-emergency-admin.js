// create-emergency-admin.js - Create emergency admin for testing
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createEmergencyAdmin() {
  try {
    console.log('🚨 Creating emergency admin for testing...\n');
    
    const whopCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_YoIIIT73rXwrtK';
    const tenantId = `tenant_${whopCompanyId}`;
    
    // 1. Ensure tenant exists
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: { whopCompanyId: whopCompanyId },
      create: {
        id: tenantId,
        name: `Emergency Company ${whopCompanyId.slice(-6)}`,
        whopCompanyId: whopCompanyId
      }
    });
    console.log('✅ Tenant ready:', tenantId);
    
    // 2. Create emergency admin user
    const emergencyAdmin = await prisma.user.upsert({
      where: { email: 'emergency.admin@test.local' },
      update: {
        role: 'ADMIN',
        whopCompanyId: whopCompanyId,
        tenantId: tenantId,
        name: 'Emergency Admin (Testing)'
      },
      create: {
        email: 'emergency.admin@test.local',
        name: 'Emergency Admin (Testing)',
        role: 'ADMIN',
        whopCompanyId: whopCompanyId,
        tenantId: tenantId,
        isFreeTier: false,
        tier: 'enterprise'
      }
    });
    console.log('✅ Emergency admin created:', emergencyAdmin.email);
    
    // 3. Create subscription for testing
    await prisma.whopSubscription.upsert({
      where: { tenantId: tenantId },
      update: {
        status: 'active',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      create: {
        tenantId: tenantId,
        whopProductId: 'prod_YByUE3J5oT4Fq',
        status: 'active',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    console.log('✅ Emergency subscription created');
    
    console.log('\n🎯 EMERGENCY ACCESS ENABLED!');
    console.log('Now you can:');
    console.log('1. Go to: http://localhost:3000/dev-login');
    console.log('2. Or create a Whop session manually');
    console.log('3. System will recognize you as company owner');
    
    console.log('\n📊 Emergency Admin Details:');
    console.log(`- Email: ${emergencyAdmin.email}`);
    console.log(`- Role: ${emergencyAdmin.role}`);
    console.log(`- Company ID: ${emergencyAdmin.whopCompanyId}`);
    console.log(`- Tenant: ${emergencyAdmin.tenantId}`);
    
  } catch (error) {
    console.error('❌ Error creating emergency admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createEmergencyAdmin();
