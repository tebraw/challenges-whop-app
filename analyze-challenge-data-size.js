/**
 * 🔍 ANALYZE CHALLENGE DATA SIZE
 * Identifies which challenges have oversized JSON fields
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeChallengeDataSize() {
  try {
    console.log('🔍 Analyzing Challenge Data Sizes...\n');

    // Get count first
    const totalCount = await prisma.challenge.count();
    console.log(`📊 Total Challenges in Database: ${totalCount}\n`);

    // Fetch challenges in batches to avoid timeout
    const batchSize = 10;
    let problematicChallenges = [];
    
    for (let i = 0; i < totalCount; i += batchSize) {
      console.log(`Processing batch ${i + 1} to ${Math.min(i + batchSize, totalCount)}...`);
      
      const challenges = await prisma.challenge.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          rules: true,
          requiredProofTypes: true,
          whopTags: true,
          monetizationRules: true,
          targetAudience: true,
          marketingTags: true
        },
        skip: i,
        take: batchSize
      });

      challenges.forEach(challenge => {
        // Calculate approximate size of each JSON field
        const sizes = {
          description: challenge.description ? challenge.description.length : 0,
          rules: challenge.rules ? JSON.stringify(challenge.rules).length : 0,
          requiredProofTypes: challenge.requiredProofTypes ? JSON.stringify(challenge.requiredProofTypes).length : 0,
          whopTags: challenge.whopTags ? JSON.stringify(challenge.whopTags).length : 0,
          monetizationRules: challenge.monetizationRules ? JSON.stringify(challenge.monetizationRules).length : 0,
          targetAudience: challenge.targetAudience ? JSON.stringify(challenge.targetAudience).length : 0,
          marketingTags: challenge.marketingTags ? JSON.stringify(challenge.marketingTags).length : 0
        };

        const totalSize = Object.values(sizes).reduce((a, b) => a + b, 0);

        // Flag challenges with data > 10KB
        if (totalSize > 10240) {
          problematicChallenges.push({
            id: challenge.id,
            title: challenge.title,
            totalSize,
            sizes
          });
        }

        // Show top 5 largest
        if (totalSize > 5000) {
          console.log(`  ⚠️ Large Challenge: "${challenge.title}" (${challenge.id})`);
          console.log(`     Total Size: ${(totalSize / 1024).toFixed(2)} KB`);
          Object.entries(sizes).forEach(([field, size]) => {
            if (size > 1000) {
              console.log(`       - ${field}: ${(size / 1024).toFixed(2)} KB`);
            }
          });
        }
      });
    }

    console.log('\n📊 SUMMARY:');
    console.log(`Total Challenges: ${totalCount}`);
    console.log(`Challenges with > 10KB data: ${problematicChallenges.length}`);
    
    if (problematicChallenges.length > 0) {
      console.log('\n🚨 PROBLEMATIC CHALLENGES (Top 10):');
      problematicChallenges
        .sort((a, b) => b.totalSize - a.totalSize)
        .slice(0, 10)
        .forEach((challenge, index) => {
          console.log(`\n${index + 1}. "${challenge.title}" (${challenge.id})`);
          console.log(`   Total Size: ${(challenge.totalSize / 1024).toFixed(2)} KB`);
          console.log(`   Breakdown:`);
          Object.entries(challenge.sizes).forEach(([field, size]) => {
            if (size > 0) {
              console.log(`     - ${field}: ${(size / 1024).toFixed(2)} KB`);
            }
          });
        });
    }

    // Calculate average total size
    const allSizes = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as count,
        pg_size_pretty(pg_total_relation_size('public."Challenge"')) as table_size
      FROM "public"."Challenge"
    `;
    
    console.log('\n💾 DATABASE SIZE:');
    console.log(allSizes);

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    
    if (error.message.includes('Bad Request') || error.message.includes('P6008')) {
      console.log('\n🚨 CRITICAL: Database query failed - likely response size limit exceeded!');
      console.log('This confirms the problem is with oversized data in Challenge table.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

analyzeChallengeDataSize();