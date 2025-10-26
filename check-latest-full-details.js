const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestChallengeDetails() {
  const challenge = await prisma.challenge.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      creator: true,
      tenant: true
    }
  });

  console.log('\n=== LATEST CHALLENGE - FULL DETAILS ===\n');
  console.log('Challenge ID:', challenge.id);
  console.log('Challenge Title:', challenge.title);
  console.log('Challenge Description:', challenge.description);
  console.log('Created At:', challenge.createdAt.toISOString());
  console.log('');
  
  console.log('=== IDs ===');
  console.log('experienceId:', challenge.experienceId);
  console.log('tenantId:', challenge.tenantId);
  console.log('creatorId:', challenge.creatorId);
  console.log('whopCreatorId:', challenge.whopCreatorId);
  console.log('');
  
  console.log('=== CREATOR (from creator field) ===');
  if (challenge.creator) {
    console.log('Creator found:', true);
    console.log('Creator.id:', challenge.creator.id);
    console.log('Creator.whopUserId:', challenge.creator.whopUserId);
    console.log('Creator.whopCompanyId:', challenge.creator.whopCompanyId);
    console.log('Creator.name:', challenge.creator.name);
    console.log('Creator.email:', challenge.creator.email);
    console.log('Creator.role:', challenge.creator.role);
  } else {
    console.log('❌ NO CREATOR FOUND!');
  }
  console.log('');
  
  console.log('=== TENANT ===');
  if (challenge.tenant) {
    console.log('Tenant.id:', challenge.tenant.id);
    console.log('Tenant.name:', challenge.tenant.name);
    console.log('Tenant.whopCompanyId:', challenge.tenant.whopCompanyId);
  }
  console.log('');
  
  console.log('=== MONETIZATION ===');
  console.log('Monetization Rules:', JSON.stringify(challenge.monetizationRules, null, 2));
  console.log('');
  
  console.log('=== OTHER FIELDS ===');
  console.log('proofType:', challenge.proofType);
  console.log('cadence:', challenge.cadence);
  console.log('imageUrl:', challenge.imageUrl);
  console.log('startAt:', challenge.startAt);
  console.log('endAt:', challenge.endAt);
  console.log('isPublic:', challenge.isPublic);
  console.log('featured:', challenge.featured);
  console.log('');
  
  console.log('=== PROBLEM DIAGNOSIS ===');
  if (!challenge.creatorId) {
    console.log('❌ creatorId is NULL - Challenge was created WITHOUT creator reference!');
  } else {
    console.log('✅ creatorId is set:', challenge.creatorId);
  }
  
  if (!challenge.whopCreatorId) {
    console.log('❌ whopCreatorId is NULL - Revenue distribution will NOT work!');
    
    if (challenge.creator && challenge.creator.whopUserId) {
      console.log('   BUT: Creator HAS whopUserId:', challenge.creator.whopUserId);
      console.log('   PROBLEM: whopCreatorId was NOT set from creator.whopUserId during creation!');
    } else if (challenge.creator && !challenge.creator.whopUserId) {
      console.log('   AND: Creator has NO whopUserId!');
      console.log('   PROBLEM: Creator record is missing whopUserId!');
    } else {
      console.log('   AND: No creator found at all!');
    }
  } else {
    console.log('✅ whopCreatorId is set:', challenge.whopCreatorId);
  }

  await prisma.$disconnect();
}

checkLatestChallengeDetails().catch(console.error);
