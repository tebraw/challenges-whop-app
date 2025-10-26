const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllRecentChallenges() {
  const challenges = await prisma.challenge.findMany({
    where: {
      createdAt: {
        gte: new Date('2025-10-26T13:00:00Z') // After 2pm local time
      }
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      whopCreatorId: true,
      monetizationRules: true,
      creator: {
        select: {
          whopUserId: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log('\n=== ALL CHALLENGES CREATED AFTER 14:00 (AFTER DEPLOYMENT) ===\n');
  
  const deploymentTime = new Date('2025-10-26T13:41:28Z');
  
  challenges.forEach(challenge => {
    const challengeTime = new Date(challenge.createdAt);
    const afterDeployment = challengeTime > deploymentTime;
    const isPaid = challenge.monetizationRules?.enabled === true;
    
    console.log(`${challenge.title}`);
    console.log(`  ID: ${challenge.id}`);
    console.log(`  Created: ${challengeTime.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`);
    console.log(`  After deployment: ${afterDeployment ? '✅ YES' : '❌ NO'}`);
    console.log(`  Type: ${isPaid ? '💰 PAID' : '🆓 FREE'}`);
    console.log(`  whopCreatorId: ${challenge.whopCreatorId || '❌ NULL'}`);
    console.log(`  Creator whopUserId: ${challenge.creator.whopUserId}`);
    
    if (afterDeployment && !challenge.whopCreatorId) {
      console.log(`  ⚠️⚠️⚠️ PROBLEM: Created AFTER deployment but NO whopCreatorId!`);
    }
    console.log('');
  });

  await prisma.$disconnect();
}

checkAllRecentChallenges().catch(console.error);
