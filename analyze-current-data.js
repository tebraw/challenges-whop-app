const { PrismaClient } = require('@prisma/client');

async function analyzeCurrentData() {
  console.log('🔍 Analyzing current database for URL optimization...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      include: {
        users: true,
        challenges: true
      }
    });
    
    console.log('============================================================');
    console.log('📊 Current Tenants:');
    
    tenants.forEach((tenant, index) => {
      console.log(`\nTenant ${index + 1}:`);
      console.log(`  ID: ${tenant.id}`);
      console.log(`  Name: "${tenant.name}"`);
      console.log(`  Whop Company ID: ${tenant.whopCompanyId}`);
      console.log(`  Created: ${tenant.createdAt}`);
      console.log(`  Users: ${tenant.users.length}`);
      console.log(`  Challenges: ${tenant.challenges.length}`);
      
      // Check current URL fields
      console.log(`  Current URL fields:`);
      console.log(`    whopHandle: ${tenant.whopHandle || 'null'}`);
      console.log(`    whopProductId: ${tenant.whopProductId || 'null'}`);
      
      // Generate potential handle from name
      if (tenant.name) {
        const potentialHandle = tenant.name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '')
          .trim();
        console.log(`    Potential handle from name: "${potentialHandle}"`);
      }
    });
    
    // Get all users
    const users = await prisma.user.findMany();
    
    console.log('\n============================================================');
    console.log('👥 Current Users:');
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Whop User ID: ${user.whopUserId || 'null'}`);
      console.log(`  Whop Company ID: ${user.whopCompanyId || 'null'}`);
      console.log(`  Tenant ID: ${user.tenantId}`);
    });
    
    // Get challenges to understand current URL generation
    const challenges = await prisma.challenge.findMany({
      include: {
        tenant: true
      }
    });
    
    console.log('\n============================================================');
    console.log('🎯 Current Challenges (for URL analysis):');
    
    challenges.forEach((challenge, index) => {
      console.log(`\nChallenge ${index + 1}:`);
      console.log(`  ID: ${challenge.id}`);
      console.log(`  Title: "${challenge.title}"`);
      console.log(`  Tenant: "${challenge.tenant.name}"`);
      console.log(`  Whop Company ID: ${challenge.tenant.whopCompanyId}`);
      
      // Show what current URL would be
      const currentUrl = `https://whop.com/company${challenge.tenant.whopCompanyId}/`;
      console.log(`  Current URL: ${currentUrl}`);
      
      // Show what optimized URL could be
      if (challenge.tenant.name) {
        const handle = challenge.tenant.name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '')
          .trim();
        
        if (handle) {
          const optimizedUrl = `https://whop.com/${handle}/?productId=prod_example`;
          console.log(`  Optimized URL could be: ${optimizedUrl}`);
        }
      }
    });
    
    console.log('\n============================================================');
    console.log('🎯 URL OPTIMIZATION SUMMARY:');
    console.log(`\nFound ${tenants.length} tenant(s) that need URL optimization:`);
    
    tenants.forEach((tenant) => {
      console.log(`\n📋 Tenant: "${tenant.name}"`);
      console.log(`   Company ID: ${tenant.whopCompanyId}`);
      console.log(`   Current has handle: ${tenant.whopHandle ? 'YES' : 'NO'}`);
      console.log(`   Current has product ID: ${tenant.whopProductId ? 'YES' : 'NO'}`);
      
      if (tenant.name && tenant.name !== 'ChallengesAPP') {
        console.log(`   ⚠️  Name mismatch: Expected "ChallengesAPP", got "${tenant.name}"`);
      }
      
      if (tenant.name === 'ChallengesAPP') {
        console.log(`   ✅ Perfect! Name matches community: "ChallengesAPP"`);
        console.log(`   📈 Should generate: https://whop.com/challengesapp/?productId=...`);
      }
    });
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Update tenant with real Whop handle: "challengesapp"');
    console.log('2. Add real product ID from Whop API');
    console.log('3. Test URL optimization system');
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCurrentData().catch(console.error);