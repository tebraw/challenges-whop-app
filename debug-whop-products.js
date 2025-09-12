const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugChallenge() {
  try {
    console.log('🔍 Debugging Whop Products Issue...\n');
    
    const challenge = await prisma.challenge.findUnique({
      where: { id: 'cm3c3yrgi0001kqj6k6sflzjp' },
      select: { 
        id: true,
        title: true,
        creatorId: true,
        whopCreatorId: true,
        tenantId: true
      }
    });
    
    console.log('📋 Challenge details:', challenge);
    
    const user = await prisma.user.findFirst({
      where: { email: 'challengesapp@whop.local' },
      select: {
        id: true,
        email: true,
        whopUserId: true,
        whopCompanyId: true,
        role: true
      }
    });
    
    console.log('👤 Current user:', user);
    
    if (challenge && user) {
      console.log('\n🔍 Analysis:');
      console.log('❓ Creator ID matches User ID:', challenge.creatorId === user.id);
      console.log('❓ Whop Creator ID exists:', !!challenge.whopCreatorId);
      console.log('❓ User Whop Company ID exists:', !!user.whopCompanyId);
      console.log('❓ Whop Creator ID matches User Whop Company ID:', challenge.whopCreatorId === user.whopCompanyId);
      
      console.log('\n🔧 Expected behavior:');
      console.log('- Challenge.whopCreatorId should be:', user.whopCompanyId);
      console.log('- Current Challenge.whopCreatorId is:', challenge.whopCreatorId);
      
      if (challenge.whopCreatorId !== user.whopCompanyId) {
        console.log('\n❌ PROBLEM FOUND: Challenge whopCreatorId does not match user whopCompanyId');
        console.log('✅ SOLUTION: Update challenge to use correct whopCreatorId');
        
        // Fix the challenge
        const updated = await prisma.challenge.update({
          where: { id: challenge.id },
          data: { whopCreatorId: user.whopCompanyId },
          select: { id: true, whopCreatorId: true }
        });
        
        console.log('🔄 Updated challenge:', updated);
        console.log('✅ Challenge updated successfully!');
      } else {
        console.log('\n✅ Challenge whopCreatorId is correct');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChallenge();
