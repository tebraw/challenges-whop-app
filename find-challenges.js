const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findChallenges() {
  try {
    const challenges = await prisma.challenge.findMany({
      select: { 
        id: true,
        title: true,
        creatorId: true,
        whopCreatorId: true
      },
      take: 5
    });
    
    console.log('📋 Available challenges:');
    challenges.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.title} (${c.id})`);
      console.log(`     Creator: ${c.creatorId}`);
      console.log(`     Whop Creator: ${c.whopCreatorId}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findChallenges();
