const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugChallengeData() {
  try {
    console.log('🔍 Fetching all challenges to debug rules/rewards data...\n');
    
    const challenges = await prisma.challenge.findMany({
      select: {
        id: true,
        title: true,
        rules: true
      }
    });

    challenges.forEach((challenge, index) => {
      console.log(`\n--- Challenge ${index + 1} ---`);
      console.log(`ID: ${challenge.id}`);
      console.log(`Title: ${challenge.title}`);
      console.log(`Rules Type: ${typeof challenge.rules}`);
      console.log(`Rules Value:`, challenge.rules);
      
      if (challenge.rules) {
        if (Array.isArray(challenge.rules)) {
          console.log(`✅ Rules is ARRAY (rewards) with ${challenge.rules.length} items`);
          challenge.rules.forEach((reward, i) => {
            console.log(`  Reward ${i + 1}:`, reward);
          });
        } else if (typeof challenge.rules === 'string') {
          console.log(`📝 Rules is STRING (policy): "${challenge.rules.substring(0, 100)}..."`);
        } else {
          console.log(`🤷 Rules is OBJECT:`, JSON.stringify(challenge.rules, null, 2));
        }
      } else {
        console.log(`❌ Rules is NULL/UNDEFINED`);
      }
    });

  } catch (error) {
    console.error('❌ Error debugging challenge data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChallengeData();
