const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllDemoChallenges() {
  try {
    console.log('=== DELETING ALL DEMO CHALLENGES ===');
    
    // Find all demo challenges first
    const demoChallenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { title: { contains: '30-Day Fitness' } },
          { title: { contains: '21-Day Reading' } },
          { title: { contains: '14-Day Mindfulness' } },
          { title: { contains: '7-Day Creative Writing' } },
          { title: { contains: 'Demo' } },
          { title: { contains: 'demo' } },
          { title: { contains: 'Fitness Challenge' } },
          { title: { contains: 'Reading Marathon' } },
          { title: { contains: 'Mindfulness Journey' } },
          { title: { contains: 'Writing Sprint' } }
        ]
      },
      select: {
        id: true,
        title: true,
        experienceId: true
      }
    });
    
    console.log(`Found ${demoChallenges.length} demo challenges to delete:`);
    console.log('');
    
    // Show what will be deleted
    demoChallenges.forEach((challenge, index) => {
      console.log(`${index + 1}. ${challenge.title}`);
      console.log(`   ID: ${challenge.id}`);
      console.log(`   Experience: ${challenge.experienceId}`);
    });
    
    console.log('');
    console.log('🗑️  Deleting challenges...');
    
    // Delete related data first (to avoid foreign key constraints)
    const challengeIds = demoChallenges.map(c => c.id);
    
    if (challengeIds.length > 0) {
      // Delete related enrollments
      const deletedEnrollments = await prisma.enrollment.deleteMany({
        where: { challengeId: { in: challengeIds } }
      });
      
      // Delete related challenge offers
      const deletedOffers = await prisma.challengeOffer.deleteMany({
        where: { challengeId: { in: challengeIds } }
      });
      
      // Delete related winners
      const deletedWinners = await prisma.challengeWinner.deleteMany({
        where: { challengeId: { in: challengeIds } }
      });
      
      // Delete related notifications
      const deletedNotifications = await prisma.internalNotification.deleteMany({
        where: { challengeId: { in: challengeIds } }
      });
      
      // Delete related conversions
      const deletedConversions = await prisma.offerConversion.deleteMany({
        where: { challengeId: { in: challengeIds } }
      });
      
      console.log(`✅ Deleted ${deletedEnrollments.count} enrollments`);
      console.log(`✅ Deleted ${deletedOffers.count} challenge offers`);
      console.log(`✅ Deleted ${deletedWinners.count} winners`);
      console.log(`✅ Deleted ${deletedNotifications.count} notifications`);
      console.log(`✅ Deleted ${deletedConversions.count} conversions`);
      
      // Now delete the challenges themselves
      const deletedChallenges = await prisma.challenge.deleteMany({
        where: { id: { in: challengeIds } }
      });
      
      console.log(`✅ Deleted ${deletedChallenges.count} demo challenges`);
    } else {
      console.log('No demo challenges found to delete.');
    }
    
    // Verify deletion
    const remainingDemoChallenges = await prisma.challenge.count({
      where: {
        OR: [
          { title: { contains: '30-Day Fitness' } },
          { title: { contains: '21-Day Reading' } },
          { title: { contains: '14-Day Mindfulness' } },
          { title: { contains: '7-Day Creative Writing' } },
          { title: { contains: 'Demo' } },
          { title: { contains: 'demo' } }
        ]
      }
    });
    
    console.log('');
    console.log('=== DELETION SUMMARY ===');
    console.log(`Demo challenges remaining: ${remainingDemoChallenges}`);
    
    if (remainingDemoChallenges === 0) {
      console.log('🎉 All demo challenges successfully deleted!');
      console.log('The database is now clean of example content.');
    } else {
      console.log('⚠️  Some demo challenges may still exist.');
    }
    
    // Show current challenge count
    const totalChallenges = await prisma.challenge.count();
    console.log(`Total challenges in database: ${totalChallenges}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error deleting demo challenges:', error.message);
    await prisma.$disconnect();
  }
}

deleteAllDemoChallenges();