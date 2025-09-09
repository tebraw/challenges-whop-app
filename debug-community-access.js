// Debug Community Member Access for Challenge

const { PrismaClient } = require('@prisma/client');

async function debugCommunityAccess() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging Community Member Access...\n');
    
    // Get challenge
    const challenge = await prisma.challenge.findFirst({
      include: { tenant: true }
    });
    
    if (!challenge) {
      console.log('❌ No challenge found');
      return;
    }
    
    console.log(`📋 Challenge: ${challenge.title}`);
    console.log(`🏢 Challenge Company: ${challenge.tenant?.whopCompanyId}\n`);
    
    // Test different user scenarios
    const scenarios = [
      {
        name: 'Admin User',
        email: 'challengesapp@whop.local',
        expectedRoute: '/admin/c/' + challenge.id
      },
      {
        name: 'Test Participant',
        email: 'participant@test.local', 
        expectedRoute: '/c/' + challenge.id + '/participate'
      },
      {
        name: 'Community Member (Same Company)',
        companyId: challenge.tenant?.whopCompanyId,
        isParticipant: false,
        expectedRoute: '/c/' + challenge.id
      },
      {
        name: 'Guest (Different Company)',
        companyId: 'different-company-id',
        isParticipant: false,
        expectedRoute: '/discover/c/' + challenge.id
      }
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n🎭 Scenario: ${scenario.name}`);
      
      let user = null;
      if (scenario.email) {
        user = await prisma.user.findUnique({
          where: { email: scenario.email }
        });
      }
      
      // Simulate access check
      const userCompanyId = user?.whopCompanyId || scenario.companyId;
      const hasCommunityAccess = userCompanyId === challenge.tenant?.whopCompanyId;
      
      let isParticipant = false;
      if (user) {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            userId: user.id,
            challengeId: challenge.id
          }
        });
        isParticipant = !!enrollment;
      }
      
      const userType = user?.role === 'ADMIN' ? 'company_owner' : 'user';
      
      console.log(`  - User Company: ${userCompanyId}`);
      console.log(`  - Challenge Company: ${challenge.tenant?.whopCompanyId}`);
      console.log(`  - Has Community Access: ${hasCommunityAccess}`);
      console.log(`  - Is Participant: ${isParticipant}`);
      console.log(`  - User Type: ${userType}`);
      
      // Determine route based on logic
      let actualRoute = '/discover/c/' + challenge.id; // Default
      
      if (userType === 'company_owner' && hasCommunityAccess) {
        actualRoute = `/admin/c/${challenge.id}`;
      } else if (isParticipant && hasCommunityAccess) {
        actualRoute = `/c/${challenge.id}/participate`;
      } else if (hasCommunityAccess && !isParticipant) {
        actualRoute = `/c/${challenge.id}`;
      }
      
      console.log(`  - Expected Route: ${scenario.expectedRoute}`);
      console.log(`  - Actual Route: ${actualRoute}`);
      console.log(`  - Correct: ${actualRoute === scenario.expectedRoute ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCommunityAccess();
