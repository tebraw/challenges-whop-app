const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExactTime() {
  const challenge = await prisma.challenge.findUnique({
    where: { id: 'cmh7rd4hv001dybfmrtmjha3s' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      whopCreatorId: true,
      creator: {
        select: {
          whopUserId: true,
          name: true,
          createdAt: true
        }
      }
    }
  });

  console.log('\n=== EXACT TIMESTAMPS ===\n');
  
  const challengeTime = new Date(challenge.createdAt);
  const paymentTime = new Date('2025-10-26T14:46:20+01:00');
  const deploymentTime = new Date('2025-10-26T14:41:28+01:00');
  
  console.log('Challenge created (UTC):', challenge.createdAt.toISOString());
  console.log('Challenge created (Local):', challengeTime.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }));
  console.log('');
  console.log('Payment made (Local):', paymentTime.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }));
  console.log('Deployment time (Local):', deploymentTime.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }));
  console.log('');
  console.log('Challenge whopCreatorId:', challenge.whopCreatorId);
  console.log('Creator whopUserId:', challenge.creator.whopUserId);
  console.log('');
  console.log('=== TIMELINE ===');
  console.log('Challenge created:', challengeTime.toISOString());
  console.log('Deployment:      ', deploymentTime.toISOString());
  console.log('Payment made:    ', paymentTime.toISOString());
  console.log('');
  
  const createdBeforeDeployment = challengeTime < deploymentTime;
  const createdAfterDeployment = challengeTime > deploymentTime;
  
  console.log('Challenge created BEFORE deployment?', createdBeforeDeployment);
  console.log('Challenge created AFTER deployment?', createdAfterDeployment);
  console.log('');
  console.log('Minutes between challenge and deployment:', 
    Math.round((deploymentTime - challengeTime) / 1000 / 60));

  await prisma.$disconnect();
}

checkExactTime().catch(console.error);
