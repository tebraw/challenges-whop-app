// scripts/check-remaining-data.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRemainingData() {
  try {
    console.log('🔍 Checking remaining data in database...\n');
    
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`👥 Remaining users (${users.length}):`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'} (${user.email}) - Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt.toISOString()}\n`);
    });
    
    // Check challenges
    const challenges = await prisma.challenge.count();
    console.log(`📊 Remaining challenges: ${challenges}`);
    
    // Check enrollments
    const enrollments = await prisma.enrollment.count();
    console.log(`📝 Remaining enrollments: ${enrollments}`);
    
    // Check offers
    const offers = await prisma.challengeOffer.count();
    console.log(`💰 Remaining offers: ${offers}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRemainingData();
