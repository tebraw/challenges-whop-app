const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkChallenges() {
  const challenges = await prisma.challenge.findMany({
    select: {
      id: true,
      title: true,
      creatorId: true,
      whopCreatorId: true,
      monetizationRules: true,
      creator: {
        select: {
          id: true,
          whopUserId: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('\n=== CHALLENGE CREATOR IDs ===\n');
  
  challenges.forEach((challenge, index) => {
    const isPaid = challenge.monetizationRules?.enabled === true;
    console.log(`${index + 1}. ${challenge.title}`);
    console.log(`   Challenge ID: ${challenge.id}`);
    console.log(`   Type: ${isPaid ? '💰 PAID' : '🆓 FREE'}`);
    console.log(`   Creator (DB ID): ${challenge.creatorId}`);
    console.log(`   whopCreatorId in Challenge: ${challenge.whopCreatorId || '❌ NULL'}`);
    console.log(`   Creator's whopUserId: ${challenge.creator?.whopUserId || '❌ NULL'}`);
    console.log(`   Creator Name: ${challenge.creator?.name || 'Unknown'}`);
    
    if (isPaid && !challenge.whopCreatorId) {
      console.log(`   ⚠️  PROBLEM: Paid challenge without whopCreatorId!`);
    }
    console.log('');
  });

  await prisma.$disconnect();
}

checkChallenges().catch(console.error);
