// debug-company-id-source.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCompanyIdSource() {
  try {
    console.log('🔍 DEBUGGING MYSTERIOUS COMPANY ID');
    console.log('====================================');
    
    const mysteriousCompanyId = '9nmw5yleoqldrxf7n48c';
    console.log(`🎯 Mysterious Company ID: ${mysteriousCompanyId}`);
    
    // 1. Check all users with this company ID
    const usersWithThisCompany = await prisma.user.findMany({
      where: {
        whopCompanyId: mysteriousCompanyId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n1. ALL USERS WITH THIS COMPANY ID:');
    console.log(`   Found ${usersWithThisCompany.length} users`);
    
    usersWithThisCompany.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      📧 Email: ${user.email}`);
      console.log(`      🔑 Whop User ID: ${user.whopUserId}`);
      console.log(`      🎭 Role: ${user.role}`);
      console.log(`      📱 Experience ID: ${user.experienceId}`);
      console.log(`      📅 Created: ${user.createdAt}`);
      console.log(`      🔄 Subscription: ${user.subscriptionStatus}`);
      console.log('');
    });
    
    // 2. Check if this is in any environment variables or config
    console.log('\n2. CHECKING POSSIBLE SOURCES:');
    console.log('   This Company ID might come from:');
    console.log('   - Default value in middleware');
    console.log('   - Fallback in header extraction');
    console.log('   - Environment variable');
    console.log('   - Hardcoded test value');
    console.log('   - Whop development/test company');
    
    // 3. Check recent user creation pattern
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log('\n3. RECENT USER CREATIONS (last 24h):');
    recentUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      🏢 Company ID: ${user.whopCompanyId}`);
      console.log(`      🔑 Whop User ID: ${user.whopUserId}`);
      console.log(`      📅 Created: ${user.createdAt}`);
      
      if (user.whopCompanyId === mysteriousCompanyId) {
        console.log('      ⚠️  SAME MYSTERIOUS COMPANY ID!');
      }
      console.log('');
    });
    
    // 4. Check if there are any other company IDs
    const uniqueCompanyIds = await prisma.user.groupBy({
      by: ['whopCompanyId'],
      _count: {
        whopCompanyId: true
      },
      where: {
        whopCompanyId: {
          not: null
        }
      }
    });
    
    console.log('\n4. ALL UNIQUE COMPANY IDs IN DATABASE:');
    uniqueCompanyIds.forEach((group, index) => {
      console.log(`   ${index + 1}. Company ID: ${group.whopCompanyId}`);
      console.log(`      👥 Users with this ID: ${group._count.whopCompanyId}`);
      
      if (group.whopCompanyId === mysteriousCompanyId) {
        console.log('      🔥 THIS IS THE MYSTERIOUS ONE!');
      }
      console.log('');
    });
    
    console.log('\n5. ANALYSIS:');
    if (uniqueCompanyIds.length === 1 && uniqueCompanyIds[0].whopCompanyId === mysteriousCompanyId) {
      console.log('   🚨 PROBLEM FOUND: Only one Company ID exists!');
      console.log('   💡 This suggests it\'s a hardcoded fallback value');
      console.log('   🔧 Need to check middleware and auth code');
    } else {
      console.log('   ✅ Multiple Company IDs exist - this might be legitimate');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCompanyIdSource();