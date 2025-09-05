// scripts/cleanup-test-data.js
// Script zum Aufräumen von Test-Challenges für Production-Deployment

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTestData() {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // 1. Show current challenges
    const challenges = await prisma.challenge.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            challengeOffers: true,
            winners: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📊 Found ${challenges.length} challenges:`);
    challenges.forEach((challenge, index) => {
      console.log(`${index + 1}. "${challenge.title}"`);
      console.log(`   ID: ${challenge.id}`);
      console.log(`   Created: ${challenge.createdAt.toISOString()}`);
      console.log(`   Participants: ${challenge._count.enrollments}`);
      console.log(`   Offers: ${challenge._count.challengeOffers}`);
      console.log(`   Winners: ${challenge._count.winners}`);
      console.log('');
    });
    
    // 2. Identify test challenges (you can customize these patterns)
    const testPatterns = [
      /test/i,
      /demo/i,
      /example/i,
      /sample/i,
      /temp/i,
      /debug/i,
      /trial/i,
      /fitness transformation/i, // Demo challenges
      /upload test/i,
      /special offers test/i,
      /mandatory rewards test/i
    ];
    
    const testChallenges = challenges.filter(challenge => 
      testPatterns.some(pattern => 
        pattern.test(challenge.title) || 
        pattern.test(challenge.description || '')
      )
    );
    
    if (testChallenges.length === 0) {
      console.log('✅ No test challenges found to clean up!');
      return;
    }
    
    console.log(`\n🎯 Found ${testChallenges.length} test challenges to clean up:`);
    testChallenges.forEach((challenge, index) => {
      console.log(`${index + 1}. "${challenge.title}" (${challenge.id})`);
    });
    
    // Uncomment the following section to actually delete the test challenges
    /*
    console.log('\n🗑️  Cleaning up test challenges...');
    
    for (const challenge of testChallenges) {
      console.log(`Deleting "${challenge.title}"...`);
      
      // Delete related data first (foreign key constraints)
      await prisma.challengeOffer.deleteMany({
        where: { challengeId: challenge.id }
      });
      
      await prisma.enrollment.deleteMany({
        where: { challengeId: challenge.id }
      });
      
      await prisma.challengeWinner.deleteMany({
        where: { challengeId: challenge.id }
      });
      
      // Delete the challenge
      await prisma.challenge.delete({
        where: { id: challenge.id }
      });
    }
    
    console.log(`✅ Successfully cleaned up ${testChallenges.length} test challenges!`);
    */
    
    console.log('\n⚠️  To actually delete these challenges, uncomment the deletion code in this script.');
    console.log('📝 Make sure to backup your database before running the deletion!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Additional function to clean up test users
async function cleanupTestUsers() {
  try {
    console.log('\n👥 Checking for test users...');
    
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'demo' } },
          { email: { contains: 'localhost' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'Demo' } }
        ]
      }
    });
    
    console.log(`Found ${testUsers.length} test users:`);
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking test users:', error);
  }
}

// Run the cleanup
async function main() {
  console.log('🔧 Database Cleanup Tool for Production Deployment');
  console.log('==================================================');
  
  await cleanupTestData();
  await cleanupTestUsers();
  
  console.log('\n🚀 Database cleanup analysis complete!');
  console.log('💡 Review the results above before proceeding with actual deletion.');
}

main();
