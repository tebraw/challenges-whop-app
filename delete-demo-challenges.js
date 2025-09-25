const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteDemoChallenges() {
  console.log('🗑️ Deleting demo challenges...\n');

  try {
    // Delete all challenges from demo tenant
    const demoChallenges = await prisma.challenge.findMany({
      where: {
        tenant: {
          whopCompanyId: 'demo-company'
        }
      },
      include: {
        enrollments: true
      }
    });

    console.log(`Found ${demoChallenges.length} demo challenges to delete:`);
    
    for (const challenge of demoChallenges) {
      console.log(`- ${challenge.title} (ID: ${challenge.id})`);
      
      // Delete related data first
      await prisma.enrollment.deleteMany({
        where: { challengeId: challenge.id }
      });
      
      // Delete the challenge
      await prisma.challenge.delete({
        where: { id: challenge.id }
      });
    }

    // Optionally delete the demo tenant if no other data exists
    const remainingData = await prisma.challenge.count({
      where: {
        tenant: {
          whopCompanyId: 'demo-company'
        }
      }
    });

    if (remainingData === 0) {
      await prisma.tenant.deleteMany({
        where: { whopCompanyId: 'demo-company' }
      });
      console.log('✅ Demo tenant deleted as well');
    }

    console.log('\n✅ All demo challenges deleted successfully!');
    console.log('📸 Hope you got great screenshots!');

  } catch (error) {
    console.error('❌ Error deleting demo challenges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDemoChallenges();