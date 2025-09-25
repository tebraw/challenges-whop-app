const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addImagesToDemoChallenges() {
  try {
    console.log('=== ADDING IMAGES TO DEMO CHALLENGES ===');
    
    // Define image URLs for each challenge type
    const challengeImages = {
      '30-Day Fitness Challenge': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop&crop=center',
      '21-Day Reading Marathon': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=center',
      '14-Day Mindfulness Journey': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&crop=center',
      '7-Day Creative Writing Sprint': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=400&fit=crop&crop=center'
    };
    
    // Find all demo challenges
    const demoChallenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { title: '30-Day Fitness Challenge' },
          { title: '21-Day Reading Marathon' },
          { title: '14-Day Mindfulness Journey' },
          { title: '7-Day Creative Writing Sprint' }
        ]
      },
      select: {
        id: true,
        title: true,
        imageUrl: true
      }
    });
    
    console.log(`Found ${demoChallenges.length} demo challenges to update:`);
    console.log('');
    
    // Update each challenge with appropriate image
    for (const challenge of demoChallenges) {
      const imageUrl = challengeImages[challenge.title];
      
      if (imageUrl) {
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: { imageUrl: imageUrl }
        });
        
        console.log(`✅ Updated "${challenge.title}"`);
        console.log(`   Image: ${imageUrl}`);
        console.log('');
      } else {
        console.log(`⚠️  No image defined for: ${challenge.title}`);
      }
    }
    
    // Show final summary with images
    const updatedChallenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { title: '30-Day Fitness Challenge' },
          { title: '21-Day Reading Marathon' },
          { title: '14-Day Mindfulness Journey' },
          { title: '7-Day Creative Writing Sprint' }
        ]
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        experienceId: true
      }
    });
    
    console.log('=== DEMO CHALLENGES WITH IMAGES ===');
    updatedChallenges.forEach((challenge, index) => {
      console.log(`${index + 1}. ${challenge.title}`);
      console.log(`   ID: ${challenge.id}`);
      console.log(`   URL: /experiences/${challenge.experienceId}/c/${challenge.id}`);
      console.log(`   Image: ${challenge.imageUrl || 'No image'}`);
      console.log('');
    });
    
    console.log('🎉 All demo challenges now have beautiful example images!');
    console.log('');
    console.log('📸 Image Sources:');
    console.log('• Fitness: High-energy workout scene with weights');
    console.log('• Reading: Cozy book and coffee setup');
    console.log('• Mindfulness: Peaceful meditation by the water');
    console.log('• Writing: Classic typewriter and vintage aesthetic');
    console.log('');
    console.log('Ready for visual testing in the Whop Experience! 🚀');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error adding images to demo challenges:', error.message);
    await prisma.$disconnect();
  }
}

addImagesToDemoChallenges();