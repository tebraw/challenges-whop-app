/**
 * 🔍 DEEP ANALYSIS: Why Prisma Studio Fails on Challenge Table
 * Identifies the exact cause of "Bad Request" error
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepAnalyzeChallengeIssue() {
  try {
    console.log('🔍 Deep Analysis: Challenge Table Query Issue\n');

    // Test 1: Simple count (should work)
    console.log('1️⃣ Testing simple COUNT query...');
    try {
      const count = await prisma.challenge.count();
      console.log(`   ✅ Count successful: ${count} challenges\n`);
    } catch (error) {
      console.log(`   ❌ Count failed: ${error.message}\n`);
    }

    // Test 2: Select only IDs (minimal data)
    console.log('2️⃣ Testing minimal SELECT (ID only)...');
    try {
      const ids = await prisma.challenge.findMany({
        select: { id: true }
      });
      console.log(`   ✅ Minimal select successful: ${ids.length} challenges\n`);
    } catch (error) {
      console.log(`   ❌ Minimal select failed: ${error.message}\n`);
    }

    // Test 3: Select with JSON fields (potential culprit)
    console.log('3️⃣ Testing SELECT with JSON fields...');
    try {
      const withJson = await prisma.challenge.findMany({
        select: {
          id: true,
          title: true,
          rules: true,
          whopTags: true,
          monetizationRules: true,
          targetAudience: true,
          marketingTags: true
        }
      });
      console.log(`   ✅ JSON fields select successful: ${withJson.length} challenges`);
      
      // Check sizes
      withJson.forEach(c => {
        const rulesSize = c.rules ? JSON.stringify(c.rules).length : 0;
        const tagsSize = c.whopTags ? JSON.stringify(c.whopTags).length : 0;
        const monetSize = c.monetizationRules ? JSON.stringify(c.monetizationRules).length : 0;
        const targetSize = c.targetAudience ? JSON.stringify(c.targetAudience).length : 0;
        const marketSize = c.marketingTags ? JSON.stringify(c.marketingTags).length : 0;
        const total = rulesSize + tagsSize + monetSize + targetSize + marketSize;
        
        if (total > 5000) {
          console.log(`   ⚠️ Large JSON data in "${c.title}": ${(total / 1024).toFixed(2)} KB`);
        }
      });
      console.log('');
    } catch (error) {
      console.log(`   ❌ JSON fields select failed: ${error.message}\n`);
    }

    // Test 4: Select with ALL relations (this might fail)
    console.log('4️⃣ Testing SELECT with ALL relations (Prisma Studio behavior)...');
    try {
      const withRelations = await prisma.challenge.findMany({
        include: {
          enrollments: true,
          challengeOffers: true,
          notifications: true,
          conversions: true,
          revenueShares: true,
          winners: true,
          creator: true,
          tenant: true
        }
      });
      console.log(`   ✅ Full relations select successful: ${withRelations.length} challenges\n`);
    } catch (error) {
      console.log(`   ❌ Full relations select FAILED: ${error.message}`);
      console.log(`   🚨 THIS IS THE PROBLEM! Prisma Studio tries to load all relations!\n`);
      return 'RELATIONS_TOO_LARGE';
    }

    // Test 5: Check Prisma Accelerate response size
    console.log('5️⃣ Estimating total response size...');
    try {
      const challenges = await prisma.challenge.findMany({
        include: {
          _count: {
            select: {
              enrollments: true,
              challengeOffers: true,
              notifications: true,
              conversions: true,
              revenueShares: true
            }
          }
        }
      });

      let estimatedSize = 0;
      challenges.forEach(c => {
        // Estimate size per challenge
        const baseSize = JSON.stringify(c).length;
        const relationCount = c._count.enrollments + c._count.challengeOffers + 
                            c._count.notifications + c._count.conversions + 
                            c._count.revenueShares;
        
        // Each relation adds ~500 bytes average
        const relationSize = relationCount * 500;
        estimatedSize += baseSize + relationSize;
      });

      console.log(`   📊 Estimated response size: ${(estimatedSize / 1024 / 1024).toFixed(2)} MB`);
      
      if (estimatedSize > 10 * 1024 * 1024) {
        console.log(`   🚨 EXCEEDS 10 MB LIMIT! This causes "Bad Request"\n`);
        return 'RESPONSE_TOO_LARGE';
      } else {
        console.log(`   ✅ Within 10 MB limit\n`);
      }
    } catch (error) {
      console.log(`   ❌ Size estimation failed: ${error.message}\n`);
    }

  } catch (error) {
    console.error('❌ Deep analysis failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deepAnalyzeChallengeIssue().then(result => {
  console.log('\n🎯 CONCLUSION:');
  if (result === 'RELATIONS_TOO_LARGE') {
    console.log('Problem: Loading ALL relations exceeds Prisma Accelerate limit');
    console.log('Solution: Increase Response Limit in Prisma Accelerate to 50 MiB');
  } else if (result === 'RESPONSE_TOO_LARGE') {
    console.log('Problem: Total response size exceeds 10 MiB');
    console.log('Solution: Increase Response Limit in Prisma Accelerate to 25-50 MiB');
  } else {
    console.log('Unexpected: Queries work but Prisma Studio fails');
    console.log('Prisma Studio may be using different query strategy');
  }
});