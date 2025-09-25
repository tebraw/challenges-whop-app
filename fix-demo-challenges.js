const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDemoChallengeExperiences() {
  console.log('🔧 Fixing demo challenge experience IDs...\n');

  const realExperienceId = 'biz_AhqOQDFGTZbu5g';

  try {
    // Find our demo challenges
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

    console.log('🎯 FOUND DEMO CHALLENGES:');
    demoChallenges.forEach(challenge => {
      console.log(`- ${challenge.title}: experienceId="${challenge.experienceId}" (${challenge.id})`);
    });

    if (demoChallenges.length === 0) {
      console.log('❌ No demo challenges found. Run create-demo-challenges.js first');
      return;
    }

    // Update all demo challenges to use the real experience ID
    console.log(`\n🔄 Updating all demo challenges to use real experience ID: ${realExperienceId}`);
    
    for (const challenge of demoChallenges) {
      await prisma.challenge.update({
        where: { id: challenge.id },
        data: { experienceId: realExperienceId }
      });
      console.log(`✅ Updated: ${challenge.title}`);
    }

    console.log('\n🎉 SUCCESS! All demo challenges now use the real experience ID');
    
    console.log('\n🌐 NOW YOU CAN ACCESS THEM AT:');
    console.log('\n👥 EXPERIENCE VIEW (Member/User perspective):');
    demoChallenges.forEach(challenge => {
      console.log(`http://localhost:3000/experiences/${realExperienceId}/c/${challenge.id}`);
    });
    
    console.log('\n📋 ADMIN DASHBOARD VIEW (still works):');
    demoChallenges.forEach(challenge => {
      console.log(`http://localhost:3000/admin/c/${challenge.id}`);
    });

  } catch (error) {
    console.error('❌ Error fixing demo challenges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDemoChallengeExperiences();