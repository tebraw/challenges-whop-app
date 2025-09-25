const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRealExperiences() {
  console.log('🔍 Checking for real experiences in database...\n');

  try {
    // Check if we have any challenges with real experienceIds
    const allChallenges = await prisma.challenge.findMany({
      select: {
        id: true,
        title: true,
        experienceId: true,
        tenantId: true
      }
    });
    
    const challengesWithExperiences = allChallenges.filter(c => c.experienceId);

    console.log('📊 CHALLENGES WITH EXPERIENCE IDS:');
    challengesWithExperiences.forEach(challenge => {
      console.log(`- ${challenge.title}: experienceId="${challenge.experienceId}" (${challenge.id})`);
    });

    // Get unique experience IDs
    const uniqueExperienceIds = [...new Set(challengesWithExperiences.map(c => c.experienceId))];
    console.log(`\n🔗 UNIQUE EXPERIENCE IDS FOUND: ${uniqueExperienceIds.length}`);
    uniqueExperienceIds.forEach(expId => {
      console.log(`- ${expId}`);
    });

    // Check our demo challenges specifically
    const demoChallenges = await prisma.challenge.findMany({
      where: {
        title: {
          in: [
            '30-Day Fitness Transformation',
            'Financial Freedom in 90 Days',
            'Launch Your Side Business',
            'Master Your Morning Routine'
          ]
        }
      },
      select: {
        id: true,
        title: true,
        experienceId: true
      }
    });

    console.log('\n🎯 OUR DEMO CHALLENGES:');
    demoChallenges.forEach(challenge => {
      console.log(`- ${challenge.title}: experienceId="${challenge.experienceId}" (${challenge.id})`);
    });

    // Check if we have any real experiences that we could use
    console.log('\n💡 RECOMMENDATION:');
    if (uniqueExperienceIds.length > 0) {
      const realExpId = uniqueExperienceIds.find(id => id && !id.includes('demo'));
      if (realExpId) {
        console.log(`✅ Use existing real experience ID: ${realExpId}`);
        console.log('We should update demo challenges to use this real experience ID');
      } else {
        console.log('⚠️ All experiences seem to be demo/fake IDs');
      }
    } else {
      console.log('❌ No challenges with experience IDs found');
      console.log('Demo challenges need NULL experienceId or real experience ID');
    }

  } catch (error) {
    console.error('❌ Error checking experiences:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRealExperiences();