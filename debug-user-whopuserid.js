const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUserCreation() {
  // Die User ID vom Creator
  const userId = 'user_oushijHL1QnTx';
  
  // Schauen wir, was in der DB ist
  const user = await prisma.user.findUnique({
    where: { whopUserId: userId },
    select: {
      id: true,
      whopUserId: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true
    }
  });

  console.log('\n=== USER IN DATABASE ===\n');
  console.log('User found:', !!user);
  if (user) {
    console.log('id:', user.id);
    console.log('whopUserId:', user.whopUserId);
    console.log('name:', user.name);
    console.log('email:', user.email);
    console.log('createdAt:', user.createdAt);
    console.log('updatedAt:', user.updatedAt);
    
    console.log('\n=== ANALYSIS ===');
    console.log('user.whopUserId is:', typeof user.whopUserId, '=', JSON.stringify(user.whopUserId));
    console.log('Is whopUserId null?', user.whopUserId === null);
    console.log('Is whopUserId undefined?', user.whopUserId === undefined);
    console.log('Is whopUserId empty string?', user.whopUserId === '');
    console.log('Is whopUserId falsy?', !user.whopUserId);
  }

  await prisma.$disconnect();
}

debugUserCreation().catch(console.error);
