const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createActiveChallenge() {
  console.log('🎯 CREATING ACTIVE CHALLENGE FOR TESTING');
  console.log('==========================================');
  
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  const challenge = await prisma.challenge.create({
    data: {
      title: "Active Test Challenge - Experience Access",
      description: "This challenge is active and should be visible to experience users",
      startAt: now,
      endAt: tomorrow,
      tenantId: 'cmfwvpoy500052bfjgioc6wcm', // Same tenant as the user
      experienceId: 'exp_uXDw03WKWtYJ6I' // Same experience ID from logs
    }
  });
  
  console.log('✅ Created active challenge:');
  console.log(`- Title: ${challenge.title}`);
  console.log(`- ID: ${challenge.id}`);
  console.log(`- Start: ${challenge.startAt}`);
  console.log(`- End: ${challenge.endAt}`);
  console.log(`- Tenant: ${challenge.tenantId}`);
  console.log(`- Experience: ${challenge.experienceId}`);
  
  // Also enroll the user in this challenge for testing
  const user = await prisma.user.findUnique({
    where: { whopUserId: 'user_4CUq7XKZv98Zy' }
  });
  
  if (user) {
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        challengeId: challenge.id,
        experienceId: 'exp_uXDw03WKWtYJ6I'
      }
    });
    
    console.log(`✅ Enrolled user ${user.whopUserId} in challenge`);
  }
  
  await prisma.$disconnect();
}

createActiveChallenge().catch(console.error);