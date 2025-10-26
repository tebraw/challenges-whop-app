const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugChallenge() {
  const challengeId = 'cmh7rd4hv001dybfmrtmjha3s';
  
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      creator: true
    }
  });

  console.log('\n=== CHALLENGE DEBUG ===\n');
  console.log('Challenge ID:', challenge.id);
  console.log('Challenge Title:', challenge.title);
  console.log('Challenge creatorId:', challenge.creatorId);
  console.log('Challenge whopCreatorId:', challenge.whopCreatorId);
  console.log('Challenge createdAt:', challenge.createdAt);
  console.log('\n=== CREATOR INFO ===\n');
  console.log('Creator ID:', challenge.creator.id);
  console.log('Creator whopUserId:', challenge.creator.whopUserId);
  console.log('Creator whopCompanyId:', challenge.creator.whopCompanyId);
  console.log('Creator name:', challenge.creator.name);
  console.log('Creator email:', challenge.creator.email);
  console.log('Creator createdAt:', challenge.creator.createdAt);
  console.log('Creator updatedAt:', challenge.creator.updatedAt);
  
  console.log('\n=== TIMELINE ===\n');
  console.log('Creator created:', challenge.creator.createdAt);
  console.log('Creator updated:', challenge.creator.updatedAt);
  console.log('Challenge created:', challenge.createdAt);
  
  const creatorHadWhopIdWhenChallengeCreated = challenge.creator.whopUserId !== null;
  console.log('\n=== ANALYSIS ===\n');
  console.log('Creator has whopUserId NOW:', !!challenge.creator.whopUserId);
  console.log('Challenge has whopCreatorId:', !!challenge.whopCreatorId);
  console.log('Creator had whopUserId when challenge created:', creatorHadWhopIdWhenChallengeCreated);

  await prisma.$disconnect();
}

debugChallenge().catch(console.error);
