// debug-current-state.js
// Debug current database state

const { prisma } = require('./lib/prisma');

async function debugCurrentState() {
  console.log('🔍 DEBUGGING CURRENT DATABASE STATE');
  console.log('=' .repeat(50));

  try {
    // 1. Check all tenants
    const tenants = await prisma.tenant.findMany();
    console.log('\n📊 Current Tenants:');
    tenants.forEach((tenant, index) => {
      console.log(`   ${index + 1}. "${tenant.name}"`);
      console.log(`      - ID: ${tenant.id}`);
      console.log(`      - Company ID: ${tenant.whopCompanyId || 'None'}`);
      console.log(`      - Handle: ${tenant.whopHandle || 'None'}`);
      console.log(`      - Product ID: ${tenant.whopProductId || 'None'}`);
      console.log('');
    });

    // 2. Test URL optimizer function
    console.log('🔗 Testing URL Optimizer:');
    if (tenants.length > 0) {
      const { getOptimizedWhopUrl } = require('./lib/whop-url-optimizer');
      
      tenants.forEach((tenant, index) => {
        try {
          const url = getOptimizedWhopUrl(tenant);
          console.log(`   ${index + 1}. ${tenant.name}: ${url}`);
        } catch (error) {
          console.log(`   ${index + 1}. ${tenant.name}: ERROR - ${error.message}`);
        }
      });
    }

    // 3. Look for the ChallengesAPP specifically
    console.log('\n🔍 Looking for ChallengesAPP:');
    const challengesApp = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'Challenges', mode: 'insensitive' } },
          { whopCompanyId: 'comp_gqCZB_rWxdNKjd3bJi56' },
          { whopHandle: 'challengesapp' }
        ]
      }
    });

    if (challengesApp) {
      console.log('✅ Found ChallengesAPP-related tenant:');
      console.log(JSON.stringify(challengesApp, null, 2));
    } else {
      console.log('❌ No ChallengesAPP tenant found');
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugCurrentState();