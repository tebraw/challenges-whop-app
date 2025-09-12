// Debug: Check actual challenges in database vs discover API

const { PrismaClient } = require('@prisma/client');

async function debugDiscoverChallenges() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging Discover Challenges...\n');
    
    // 1. Check all challenges in database
    const allChallenges = await prisma.challenge.findMany({
      include: {
        tenant: true,
        _count: { select: { enrollments: true } }
      }
    });
    
    console.log('📋 All Challenges in Database:');
    allChallenges.forEach(challenge => {
      console.log(`  - ${challenge.title} (ID: ${challenge.id})`);
      console.log(`    Public: ${challenge.isPublic}, Company: ${challenge.tenant?.whopCompanyId}`);
    });
    
    // 2. Check public challenges (what discover should show)
    const publicChallenges = await prisma.challenge.findMany({
      where: { isPublic: true },
      include: {
        tenant: true,
        _count: { select: { enrollments: true } }
      }
    });
    
    console.log('\n🌍 Public Challenges (Discover API should return):');
    publicChallenges.forEach(challenge => {
      console.log(`  - ${challenge.title} (ID: ${challenge.id})`);
      console.log(`    Company: ${challenge.tenant?.whopCompanyId}`);
    });
    
    // 3. Test discover API call
    console.log('\n🧪 Testing Discover API...');
    try {
      const response = await fetch('http://localhost:3000/api/discover/challenges');
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.challenges) {
        console.log('\n📡 API Returns:');
        data.challenges.forEach(challenge => {
          console.log(`  - ${challenge.title} (ID: ${challenge.id})`);
        });
      }
    } catch (apiError) {
      console.log('❌ API Error:', apiError.message);
    }
    
    // 4. Check for any challenges with missing tenant data
    const orphanChallenges = await prisma.challenge.findMany({
      where: { tenantId: null },
      include: { tenant: true }
    });
    
    if (orphanChallenges.length > 0) {
      console.log('\n⚠️ Orphan Challenges (no tenant):');
      orphanChallenges.forEach(challenge => {
        console.log(`  - ${challenge.title} (ID: ${challenge.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDiscoverChallenges();
