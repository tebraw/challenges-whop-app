const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listDemoChallenges() {
  try {
    const challenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { title: { contains: 'Demo' } },
          { title: { contains: 'demo' } },
          { title: { contains: 'Fitness' } },
          { title: { contains: 'Reading' } },
          { title: { contains: 'Meditation' } },
          { title: { contains: 'Writing' } }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        experienceId: true,
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('=== CURRENT DEMO CHALLENGES ===');
    console.log('Found ' + challenges.length + ' demo challenges:');
    console.log('');
    
    challenges.forEach((challenge, index) => {
      console.log((index + 1) + '. ' + challenge.title);
      console.log('   ID: ' + challenge.id);
      console.log('   Experience: ' + challenge.experienceId);
      console.log('   Status: ' + challenge.status);
      console.log('   Description: ' + (challenge.description ? challenge.description.substring(0, 100) + '...' : 'No description'));
      console.log('');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
}

listDemoChallenges();