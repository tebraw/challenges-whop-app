const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestChallenge() {
  const challenge = await prisma.challenge.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      creator: {
        select: {
          id: true,
          whopUserId: true,
          name: true,
          email: true
        }
      }
    }
  });

  console.log('\n=== LATEST CHALLENGE ===\n');
  console.log('Challenge ID:', challenge.id);
  console.log('Challenge Title:', challenge.title);
  console.log('Created At:', challenge.createdAt.toISOString());
  console.log('Created At (Local):', new Date(challenge.createdAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }));
  console.log('');
  console.log('creatorId:', challenge.creatorId);
  console.log('whopCreatorId:', challenge.whopCreatorId);
  console.log('');
  console.log('=== CREATOR INFO ===');
  console.log('Creator ID:', challenge.creator?.id || 'NULL');
  console.log('Creator whopUserId:', challenge.creator?.whopUserId || 'NULL');
  console.log('Creator name:', challenge.creator?.name || 'NULL');
  console.log('');
  console.log('=== MONETIZATION ===');
  console.log('Monetization Rules:', JSON.stringify(challenge.monetizationRules, null, 2));
  console.log('');
  console.log('=== PROBLEM CHECK ===');
  if (!challenge.creatorId) {
    console.log('❌ creatorId is NULL!');
  }
  if (!challenge.whopCreatorId) {
    console.log('❌ whopCreatorId is NULL! Revenue distribution will NOT work!');
  }
  if (challenge.creator && !challenge.creator.whopUserId) {
    console.log('❌ Creator has no whopUserId!');
  }
  if (challenge.creatorId && challenge.whopCreatorId && challenge.creator?.whopUserId) {
    console.log('✅ All IDs present - revenue distribution should work!');
  }

  await prisma.$disconnect();
}

checkLatestChallenge().catch(console.error);
