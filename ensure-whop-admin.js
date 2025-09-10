// Robust fallback for Whop admin access
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureWhopAdminAccess() {
  try {
    const whopCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_YoIIIT73rXwrtK';
    const tenantId = `tenant_${whopCompanyId}`;
    
    console.log('🔧 Ensuring Whop admin access...');
    console.log('Company ID:', whopCompanyId);
    console.log('Tenant ID:', tenantId);
    
    // Create fallback admin user for Whop
    const fallbackAdmin = await prisma.user.upsert({
      where: { email: 'auto.admin@whop.challenges' },
      update: {
        role: 'ADMIN',
        whopCompanyId: whopCompanyId,
        tenantId: tenantId,
        name: 'Whop Admin (Auto-created)'
      },
      create: {
        email: 'auto.admin@whop.challenges',
        name: 'Whop Admin (Auto-created)',
        role: 'ADMIN',
        whopCompanyId: whopCompanyId,
        tenantId: tenantId
      }
    });

    console.log('✅ Whop admin fallback user ready:', fallbackAdmin.email);
    
    // Also ensure we have challenges
    const challengeCount = await prisma.challenge.count({
      where: { tenantId: tenantId }
    });
    
    console.log(`✅ Found ${challengeCount} challenges in tenant`);
    
    if (challengeCount === 0) {
      console.log('⚠️  No challenges found - this might be why admin panel is empty');
      console.log('Run setup-whop-admin.js to create test challenges');
    }
    
    return fallbackAdmin;
    
  } catch (error) {
    console.error('❌ Error creating Whop admin fallback:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Run this to ensure admin access
ensureWhopAdminAccess().catch(console.error);
