const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeMultiTenancy() {
  try {
    console.log('🔍 MULTI-TENANCY SECURITY ANALYSE\n');
    
    // 1. Check current tenants
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            whopCompanyId: true
          }
        },
        challenges: {
          select: {
            id: true,
            title: true,
            creatorId: true
          }
        }
      }
    });
    
    console.log('📊 CURRENT TENANTS:');
    tenants.forEach((tenant, i) => {
      console.log(`  ${i+1}. Tenant: ${tenant.name} (ID: ${tenant.id})`);
      console.log(`     Users: ${tenant.users.length}`);
      console.log(`     Challenges: ${tenant.challenges.length}`);
      tenant.users.forEach(user => {
        console.log(`       - ${user.email} (${user.role}) [Company: ${user.whopCompanyId}]`);
      });
      console.log('');
    });
    
    // 2. Check what happens when admin API is called
    console.log('⚠️  SECURITY PROBLEM DEMONSTRATION:');
    console.log('   Current Admin API (/api/admin/challenges) returns ALL challenges');
    console.log('   It does NOT filter by tenantId!');
    console.log('');
    
    // 3. What a new company owner would see
    console.log('🆕 NEW COMPANY OWNER SCENARIO:');
    console.log('   When Company "XYZ123" installs the app:');
    console.log('   1. ✅ New tenant gets created: "Company XYZ123"');
    console.log('   2. ✅ Company owner gets ADMIN role');
    console.log('   3. ❌ BUG: Admin dashboard shows ALL challenges from ALL companies!');
    console.log('   4. ❌ BUG: Can manage challenges from other companies!');
    console.log('');
    
    // 4. Check current challenges
    const allChallenges = await prisma.challenge.findMany({
      select: {
        id: true,
        title: true,
        tenantId: true,
        creatorId: true
      }
    });
    
    console.log('🔍 CURRENT CHALLENGES IN DATABASE:');
    allChallenges.forEach((challenge, i) => {
      const tenant = tenants.find(t => t.id === challenge.tenantId);
      console.log(`  ${i+1}. "${challenge.title}"`);
      console.log(`     Tenant: ${tenant?.name || 'Unknown'}`);
      console.log(`     Creator: ${challenge.creatorId}`);
      console.log('');
    });
    
    console.log('❌ CRITICAL SECURITY ISSUE:');
    console.log('   Every company owner can see and manage challenges from other companies!');
    console.log('   This violates multi-tenancy and privacy!');
    console.log('');
    
    console.log('✅ SOLUTION NEEDED:');
    console.log('   1. Fix admin APIs to filter by user.tenantId');
    console.log('   2. Add tenant isolation to all admin endpoints');
    console.log('   3. Ensure each company only sees their own data');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeMultiTenancy();
