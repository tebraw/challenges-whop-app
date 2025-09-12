const { PrismaClient } = require('@prisma/client');

async function debugCurrentDataState() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 CURRENT DATABASE STATE ANALYSIS');
    console.log('=====================================\n');
    
    // 1. Check all users with their whopCompanyId
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        whopUserId: true,
        whopCompanyId: true,
        tenantId: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('👥 USERS WITH COMPANY IDS:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email || 'N/A'}`);
      console.log(`   WhopUserId: ${user.whopUserId || 'N/A'}`);
      console.log(`   WhopCompanyId: ${user.whopCompanyId || 'N/A'}`);
      console.log(`   TenantId: ${user.tenantId || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('   ---');
    });
    
    // 2. Check all challenges with their whopCompanyId
    const challenges = await prisma.challenge.findMany({
      select: {
        id: true,
        title: true,
        whopCompanyId: true,
        tenantId: true,
        creatorId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n🎯 CHALLENGES WITH COMPANY IDS:');
    challenges.forEach((challenge, index) => {
      console.log(`${index + 1}. Title: ${challenge.title}`);
      console.log(`   WhopCompanyId: ${challenge.whopCompanyId || 'N/A'}`);
      console.log(`   TenantId: ${challenge.tenantId || 'N/A'}`);
      console.log(`   CreatorId: ${challenge.creatorId || 'N/A'}`);
      console.log(`   Created: ${challenge.createdAt}`);
      console.log('   ---');
    });
    
    // 3. Check for duplicate whopCompanyIds
    const companyGroups = {};
    users.forEach(user => {
      if (user.whopCompanyId) {
        if (!companyGroups[user.whopCompanyId]) {
          companyGroups[user.whopCompanyId] = [];
        }
        companyGroups[user.whopCompanyId].push(user);
      }
    });
    
    console.log('\n🏢 COMPANY GROUPING ANALYSIS:');
    Object.entries(companyGroups).forEach(([companyId, users]) => {
      console.log(`CompanyId: ${companyId}`);
      console.log(`Users Count: ${users.length}`);
      if (users.length > 1) {
        console.log('⚠️  MULTIPLE USERS WITH SAME COMPANY ID:');
        users.forEach(user => {
          console.log(`   - ${user.email || user.whopUserId} (Tenant: ${user.tenantId})`);
        });
      }
      console.log('   ---');
    });
    
    // 4. Check current API behavior
    console.log('\n🔍 API DEBUGGING INFO:');
    console.log('Recent users (last 5):');
    const recentUsers = users.slice(0, 5);
    recentUsers.forEach(user => {
      console.log(`- ${user.email || user.whopUserId}: Company=${user.whopCompanyId}, Tenant=${user.tenantId}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCurrentDataState();