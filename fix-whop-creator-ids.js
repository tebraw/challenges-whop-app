const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWhopCreatorIds() {
  try {
    console.log('🔧 Fixing Whop Creator IDs for all challenges...\n');
    
    // Get the user's whop company ID
    const user = await prisma.user.findFirst({
      where: { email: 'challengesapp@whop.local' },
      select: { whopCompanyId: true, id: true }
    });
    
    if (!user || !user.whopCompanyId) {
      console.log('❌ User or whopCompanyId not found');
      return;
    }
    
    console.log('👤 User Whop Company ID:', user.whopCompanyId);
    
    // Update all challenges created by this user
    const updateResult = await prisma.challenge.updateMany({
      where: { 
        creatorId: user.id,
        whopCreatorId: null  // Only update those that are null
      },
      data: { 
        whopCreatorId: user.whopCompanyId 
      }
    });
    
    console.log(`✅ Updated ${updateResult.count} challenges with Whop Creator ID`);
    
    // Verify the update
    const updatedChallenges = await prisma.challenge.findMany({
      where: { creatorId: user.id },
      select: { 
        id: true,
        title: true,
        whopCreatorId: true
      }
    });
    
    console.log('\n📋 Updated challenges:');
    updatedChallenges.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.title}`);
      console.log(`     ID: ${c.id}`);
      console.log(`     Whop Creator: ${c.whopCreatorId}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWhopCreatorIds();
