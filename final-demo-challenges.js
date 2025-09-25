const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDemoChallenges() {
  try {
    console.log('=== UPDATING DEMO CHALLENGES ===');
    
    // Find the real Experience ID
    const realExperience = await prisma.challenge.findFirst({
      where: {
        experienceId: { not: { startsWith: 'exp_' } }
      },
      select: { experienceId: true }
    });
    
    const experienceId = realExperience?.experienceId || 'biz_AhqOQDFGTZbu5g';
    console.log('Using Experience ID:', experienceId);
    
    // Update existing Demo Challenge with better content
    const existingChallenge = await prisma.challenge.findFirst({
      where: { title: '30-Day Fitness Transformation' }
    });
    
    if (existingChallenge) {
      await prisma.challenge.update({
        where: { id: existingChallenge.id },
        data: {
          title: '30-Day Fitness Challenge',
          description: `🏃‍♂️ Transform your body in 30 days! 

Join thousands in this comprehensive fitness journey:
• Daily 20-30 minute workouts
• Track progress with photos  
• Build lasting healthy habits
• Connect with supportive community

Week 1-2: Foundation Building
- Basic bodyweight exercises
- Flexibility and mobility work
- Habit formation

Week 3-4: Intensity Boost  
- Strength training progressions
- Cardio challenges
- Final transformation reveal

Requirements: Daily progress photos, 5+ workouts/week, weekly check-ins
Rewards: Fitness certificate, exclusive workout library, community badges

Ready to transform your life? Let's get started! 💪`,
          experienceId: experienceId,
          status: 'ACTIVE',
          proofType: 'PHOTO',
          startAt: new Date(),
          endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isPublic: true
        }
      });
      console.log('✅ Updated: 30-Day Fitness Challenge');
    }
    
    // Find a tenant to use
    const tenant = await prisma.tenant.findFirst({
      where: { whopCompanyId: experienceId }
    }) || await prisma.tenant.findFirst();
    
    if (!tenant) {
      console.log('❌ No tenant found. Cannot create challenges.');
      return;
    }
    
    // Create additional Demo Challenges
    const demoChallenges = [
      {
        title: '21-Day Reading Marathon',
        description: `📚 Read for 30 minutes daily and discover consistent reading habits!

Your Mission:
• Read 30+ minutes each day
• Share inspiring quotes from books
• Post daily reading progress photos
• Connect with fellow book lovers

Challenge Structure:
- Week 1: Build the habit (any genre)
- Week 2: Explore new genres  
- Week 3: Deep dive into favorites

Proof Required: Daily reading photos, quotes/insights, weekly updates
Benefits: Book recommendations, reading buddies, discussion groups, digital certificates

Transform your mind, one page at a time! 📖✨`,
        proofType: 'PHOTO',
        startAt: new Date(),
        endAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        experienceId: experienceId,
        tenantId: tenant.id,
        status: 'ACTIVE',
        isPublic: true
      },
      {
        title: '14-Day Mindfulness Journey',
        description: `🧘‍♀️ Develop inner peace through daily meditation and mindfulness practices.

Daily Practices:
• 10-15 minute guided meditations
• Mindful breathing exercises  
• Gratitude journaling
• Present moment awareness

Week 1: Foundation - Basic breathing, body scans, mindful walking
Week 2: Integration - Advanced techniques, stress tools, mindful activities

Proof: Meditation space photos, mindfulness journal entries, reflection videos
Benefits: Reduced stress, better sleep, improved focus, emotional regulation

Start your journey to inner peace today! 🌸`,
        proofType: 'TEXT',
        startAt: new Date(),
        endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        experienceId: experienceId,
        tenantId: tenant.id,
        status: 'ACTIVE',
        isPublic: true
      },
      {
        title: '7-Day Creative Writing Sprint',
        description: `✍️ Unleash creativity with daily writing prompts and challenges!

Daily Challenges:
• Unique writing prompts each day
• 500+ word creative pieces
• Character development exercises
• Story sharing and feedback

Writing Themes:
Day 1: Unexpected encounters • Day 2: Time travel adventures  
Day 3: Character backstories • Day 4: Dialogue mastery
Day 5: Setting descriptions • Day 6: Plot twists • Day 7: Story conclusions

Requirements: Daily 500+ word pieces, creative process photos, peer feedback
Community: Prompt discussions, feedback exchanges, technique workshops, story collections

Turn your ideas into amazing stories! 📝🌟`,
        proofType: 'TEXT',
        startAt: new Date(),
        endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        experienceId: experienceId,
        tenantId: tenant.id,
        status: 'ACTIVE',
        isPublic: true
      }
    ];
    
    // Create new demo challenges
    for (const challengeData of demoChallenges) {
      // Check if challenge already exists
      const existing = await prisma.challenge.findFirst({
        where: { title: challengeData.title }
      });
      
      if (!existing) {
        const challenge = await prisma.challenge.create({
          data: challengeData
        });
        console.log('✅ Created:', challengeData.title);
      } else {
        console.log('⏭️  Skipped (already exists):', challengeData.title);
      }
    }
    
    // Show final summary with IDs
    const allDemoChallenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { title: { contains: 'Challenge' } },
          { title: { contains: 'Fitness' } },
          { title: { contains: 'Reading' } },
          { title: { contains: 'Mindfulness' } },
          { title: { contains: 'Writing' } }
        ]
      },
      select: {
        id: true,
        title: true,
        experienceId: true,
        status: true
      }
    });
    
    console.log('');
    console.log('=== DEMO CHALLENGES SUMMARY ===');
    console.log('Total demo challenges:', allDemoChallenges.length);
    console.log('Experience ID used:', experienceId);
    console.log('Tenant ID used:', tenant.id);
    console.log('');
    console.log('🎉 Demo challenges ready for testing!');
    console.log('');
    
    allDemoChallenges.forEach((challenge, index) => {
      console.log(`${index + 1}. ${challenge.title}`);
      console.log(`   URL: /experiences/${challenge.experienceId}/c/${challenge.id}`);
      console.log(`   Status: ${challenge.status}`);
      console.log('');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error updating demo challenges:', error.message);
    await prisma.$disconnect();
  }
}

updateDemoChallenges();