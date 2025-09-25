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
    
    // Update existing Demo Challenge
    const existingChallenge = await prisma.challenge.findFirst({
      where: { title: '30-Day Fitness Transformation' }
    });
    
    if (existingChallenge) {
      await prisma.challenge.update({
        where: { id: existingChallenge.id },
        data: {
          title: '30-Day Fitness Challenge',
          description: 'Transform your body in 30 days! Complete daily workouts, track your progress, and build lasting healthy habits. Perfect for beginners and experienced fitness enthusiasts.',
          longDescription: `🏃‍♂️ **30-Day Fitness Challenge**

Join thousands of participants in this comprehensive fitness transformation journey!

**What you'll do:**
• Daily 20-30 minute workouts
• Track your progress with photos
• Build consistent exercise habits
• Connect with a supportive community

**Week 1-2:** Foundation Building
- Basic bodyweight exercises
- Flexibility and mobility work
- Habit formation

**Week 3-4:** Intensity Boost  
- Strength training progressions
- Cardio challenges
- Final transformation reveal

**Requirements:**
- Take daily progress photos
- Complete minimum 5 workouts per week
- Share weekly check-ins

**Rewards:**
- Fitness transformation certificate
- Access to exclusive workout library
- Community recognition badges

Ready to transform your life in just 30 days? Let's get started! 💪`,
          experienceId: experienceId,
          status: 'ACTIVE',
          type: 'PHOTO',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          maxParticipants: 100,
          isPublic: true,
          allowLateJoining: true,
          requireApproval: false
        }
      });
      console.log('✅ Updated: 30-Day Fitness Challenge');
    }
    
    // Create additional Demo Challenges
    const demoChallenges = [
      {
        title: '21-Day Reading Marathon',
        description: 'Read for 30 minutes daily and discover the joy of consistent reading habits. Share your favorite quotes and book recommendations!',
        longDescription: `📚 **21-Day Reading Marathon**

Rediscover your love for reading with this engaging 21-day challenge!

**Your Mission:**
• Read for at least 30 minutes each day
• Share inspiring quotes from your books
• Post daily reading progress photos
• Connect with fellow book lovers

**Challenge Structure:**
- **Week 1:** Build the habit (any genre)
- **Week 2:** Explore new genres
- **Week 3:** Deep dive into favorites

**Proof Required:**
- Daily photo of you reading
- Quote or insight from each session
- Weekly progress updates

**Community Benefits:**
- Book recommendations exchange
- Reading buddy connections
- Author discussion groups
- Digital reading certificates

Transform your mind, one page at a time! 📖✨`,
        type: 'PHOTO',
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        maxParticipants: 75,
        experienceId: experienceId
      },
      {
        title: '14-Day Mindfulness Journey',
        description: 'Develop inner peace through daily meditation and mindfulness practices. Perfect for stress reduction and mental clarity.',
        longDescription: `🧘‍♀️ **14-Day Mindfulness Journey**

Find your center and reduce stress with guided mindfulness practices.

**Daily Practices:**
• 10-15 minute guided meditations
• Mindful breathing exercises  
• Gratitude journaling
• Present moment awareness

**Week 1: Foundation**
- Basic breathing techniques
- Body scan meditations
- Mindful walking practice

**Week 2: Integration**
- Advanced mindfulness techniques
- Stress management tools
- Mindful daily activities

**Proof Submissions:**
- Peaceful meditation space photos
- Daily mindfulness journal entries
- Progress reflection videos

**Mental Health Benefits:**
- Reduced anxiety and stress
- Better sleep quality
- Improved focus and clarity
- Emotional regulation skills

Start your journey to inner peace today! 🌸`,
        type: 'TEXT',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        maxParticipants: 50,
        experienceId: experienceId
      },
      {
        title: '7-Day Creative Writing Sprint',
        description: 'Unleash your creativity with daily writing prompts and challenges. Share your stories and get feedback from the community!',
        longDescription: `✍️ **7-Day Creative Writing Sprint**

Ignite your creativity and develop your writing skills in just one week!

**Daily Challenges:**
• Unique writing prompts each day
• 500+ word creative pieces
• Character development exercises
• Story sharing and feedback

**Writing Themes:**
- **Day 1:** Unexpected encounters
- **Day 2:** Time travel adventures  
- **Day 3:** Character backstories
- **Day 4:** Dialogue mastery
- **Day 5:** Setting descriptions
- **Day 6:** Plot twists
- **Day 7:** Story conclusions

**Submission Requirements:**
- Daily writing piece (min 500 words)
- Creative process photos/videos
- Peer feedback participation

**Writer's Community:**
- Daily prompt discussions
- Constructive feedback exchanges
- Writing technique workshops
- Published story collections

Turn your ideas into amazing stories! 📝🌟`,
        type: 'TEXT',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxParticipants: 40,
        experienceId: experienceId
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
          data: {
            ...challengeData,
            status: 'ACTIVE',
            isPublic: true,
            allowLateJoining: true,
            requireApproval: false,
            tenant: {
              connect: {
                // Find tenant by experienceId or use default
                id: (await prisma.tenant.findFirst({
                  where: { companyId: experienceId }
                }))?.id || (await prisma.tenant.findFirst())?.id
              }
            }
          }
        });
        console.log('✅ Created:', challengeData.title);
      } else {
        console.log('⏭️  Skipped (already exists):', challengeData.title);
      }
    }
    
    // Show final summary
    const totalChallenges = await prisma.challenge.count({
      where: {
        OR: [
          { title: { contains: 'Demo' } },
          { title: { contains: 'Challenge' } },
          { title: { contains: 'Fitness' } },
          { title: { contains: 'Reading' } },
          { title: { contains: 'Mindfulness' } },
          { title: { contains: 'Writing' } }
        ]
      }
    });
    
    console.log('');
    console.log('=== DEMO CHALLENGES SUMMARY ===');
    console.log('Total demo challenges now:', totalChallenges);
    console.log('Experience ID used:', experienceId);
    console.log('All challenges are ACTIVE and public');
    console.log('');
    console.log('Demo challenges ready for testing! 🎉');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error updating demo challenges:', error.message);
    await prisma.$disconnect();
  }
}

updateDemoChallenges();