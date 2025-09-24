const { PrismaClient } = require('@prisma/client');

async function analyzeExperienceIdProblem() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== EXPERIENCE ID MISMATCH ANALYSIS ===');
    console.log('');
    
    const challengeId = 'cmfyjqn8z000f0he90cwranxl';
    const userId = 'cmfwvq3cp00072bfjq8ve23zx';
    const userTenantId = 'cmfwvpoy500052bfjgioc6wcm';
    const userCompanyId = 'biz_YoIIIT73rXwrtK';
    const currentExperienceId = 'exp_TX6Fwbq4i6779S'; // Where user is browsing
    
    console.log('🚨 ROOT CAUSE IDENTIFIED:');
    console.log('- User is browsing Experience:', currentExperienceId);
    console.log('- Challenge belongs to Experience: exp_AhqOQDFGTZbu5g');
    console.log('- EXPERIENCE ID MISMATCH! ❌');
    console.log('');
    
    console.log('🔍 DETAILED ANALYSIS:');
    
    // Get the challenge details
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { tenant: true }
    });
    
    if (challenge) {
      console.log('Challenge Details:');
      console.log('- Title:', challenge.title);
      console.log('- Challenge Experience ID:', challenge.experienceId);
      console.log('- Challenge Company:', challenge.tenant?.whopCompanyId);
      console.log('- Challenge Tenant:', challenge.tenantId);
      console.log('');
      
      console.log('User Context:');
      console.log('- Current Experience ID:', currentExperienceId);
      console.log('- User Company:', userCompanyId);
      console.log('- User Tenant:', userTenantId);
      console.log('');
      
      console.log('🎯 WHY USER SEES "JOIN COMMUNITY":');
      console.log('1. Challenge belongs to Experience:', challenge.experienceId);
      console.log('2. User is browsing Experience:', currentExperienceId);
      console.log('3. Different Experience = Different Community');
      console.log('4. Different Company (biz_AhqOQDFGTZbu5g vs biz_YoIIIT73rXwrtK)');
      console.log('5. Different Tenant (cmfy4wods0010zyfge3c8q7q5 vs cmfwvpoy500052bfjgioc6wcm)');
      console.log('');
      
      console.log('🚨 THE REAL PROBLEM:');
      console.log('This challenge should NOT appear in Discover page for exp_TX6Fwbq4i6779S!');
      console.log('It belongs to exp_AhqOQDFGTZbu5g but shows up in wrong Experience.');
      console.log('');
    }
    
    // Check the Discover page logic
    console.log('🔍 CHECKING DISCOVER PAGE QUERY:');
    
    // This is likely what the discover page is doing - showing ALL challenges instead of filtered by experienceId
    const allChallenges = await prisma.challenge.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { 
        tenant: true,
        _count: { select: { enrollments: true } }
      }
    });
    
    console.log('Recent Challenges (what Discover might be showing):');
    allChallenges.forEach((ch, index) => {
      const belongsToCurrentExp = ch.experienceId === currentExperienceId;
      console.log(`${index + 1}. ${ch.title}`);
      console.log(`   Experience: ${ch.experienceId} ${belongsToCurrentExp ? '✅' : '❌'}`);
      console.log(`   Company: ${ch.tenant?.whopCompanyId}`);
      console.log(`   Should show in current discover: ${belongsToCurrentExp ? 'YES' : 'NO'}`);
      console.log('');
    });
    
    // Check what SHOULD be in this experience
    const correctChallenges = await prisma.challenge.findMany({
      where: { experienceId: currentExperienceId },
      include: { 
        tenant: true,
        _count: { select: { enrollments: true } }
      }
    });
    
    console.log('✅ CHALLENGES THAT BELONG TO ' + currentExperienceId + ':');
    console.log('Count:', correctChallenges.length);
    correctChallenges.forEach(ch => {
      console.log(`- ${ch.title} (${ch.id})`);
      console.log(`  Company: ${ch.tenant?.whopCompanyId}`);
    });
    console.log('');
    
    console.log('🎯 SOLUTION:');
    console.log('1. Discover page should filter by experienceId');
    console.log('2. Only show challenges where challenge.experienceId === currentExperienceId');
    console.log('3. This prevents cross-experience challenge confusion');
    console.log('');
    
    console.log('📋 CURRENT BEHAVIOR:');
    console.log('- Discover shows challenges from ALL experiences');
    console.log('- User sees challenges from other communities/experiences');
    console.log('- These show as "Join Community" because they belong to different tenants');
    console.log('');
    
    console.log('✅ CORRECT BEHAVIOR:');
    console.log('- Discover should only show challenges from current experience');
    console.log('- User should only see challenges they can actually join');
    console.log('- "Join Community" button is for cross-tenant challenges within same experience');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeExperienceIdProblem();