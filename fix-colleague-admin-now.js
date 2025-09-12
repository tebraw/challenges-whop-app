#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function fixColleagueAdmin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 FIXING COLLEAGUE ADMIN STATUS\n');
    
    // Find the colleague
    const colleague = await prisma.user.findFirst({
      where: { 
        whopUserId: 'user_w3lVukX5x9ayO'
      },
      include: { tenant: true }
    });
    
    if (!colleague) {
      console.log('❌ Colleague not found!');
      return;
    }
    
    console.log('👤 Current Colleague State:');
    console.log(`   Email: ${colleague.email}`);
    console.log(`   Company ID: ${colleague.whopCompanyId}`);
    console.log(`   Role: ${colleague.role}`);
    console.log(`   Experience ID: ${colleague.experienceId}`);
    console.log(`   Tenant: ${colleague.tenant?.name} (${colleague.tenant?.whopCompanyId})`);
    
    // The correct company ID should be extracted from the real context
    // Let's assume it should be the actual company ID (not the fallback)
    const correctCompanyId = 'biz_YoIIIT73rXwrtK'; // Your real company ID
    
    console.log('\n🔧 FIXING TO COMPANY OWNER STATUS:');
    console.log(`   New Company ID: ${correctCompanyId}`);
    console.log(`   New Role: ADMIN`);
    console.log(`   Experience ID: NULL (Company Owner)`);
    
    // 1. Find or create proper company tenant
    let companyTenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: correctCompanyId }
    });
    
    if (!companyTenant) {
      companyTenant = await prisma.tenant.create({
        data: {
          name: `Company ${correctCompanyId}`,
          whopCompanyId: correctCompanyId
        }
      });
      console.log(`✅ Created company tenant: ${companyTenant.name}`);
    } else {
      console.log(`✅ Found company tenant: ${companyTenant.name}`);
    }
    
    // 2. Update colleague to be company owner admin
    const updatedColleague = await prisma.user.update({
      where: { id: colleague.id },
      data: {
        whopCompanyId: correctCompanyId,
        role: 'ADMIN',
        experienceId: null, // Company owner has no experience ID
        tenantId: companyTenant.id
      }
    });
    
    console.log('\n🎉 COLLEAGUE FIXED:');
    console.log(`   ✅ Company ID: ${updatedColleague.whopCompanyId}`);
    console.log(`   ✅ Role: ${updatedColleague.role}`);
    console.log(`   ✅ Experience ID: ${updatedColleague.experienceId || 'NULL (Company Owner)'}`);
    console.log(`   ✅ Tenant: Company-based`);
    
    // 3. Verify the fix
    console.log('\n✅ VERIFICATION:');
    const verifyUser = await prisma.user.findUnique({
      where: { id: colleague.id },
      include: { tenant: true }
    });
    
    console.log(`   Company ID: ${verifyUser.whopCompanyId}`);
    console.log(`   Role: ${verifyUser.role}`);
    console.log(`   Tenant: ${verifyUser.tenant?.name} (${verifyUser.tenant?.whopCompanyId})`);
    
    if (verifyUser.role === 'ADMIN' && verifyUser.whopCompanyId === correctCompanyId) {
      console.log('\n🎯 SUCCESS! Colleague is now Company Owner Admin');
    } else {
      console.log('\n❌ Something went wrong, check the data');
    }
    
  } catch (error) {
    console.error('❌ Error fixing colleague:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixColleagueAdmin();