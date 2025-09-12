const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentUsers() {
  console.log('🔍 Checking current users with fallback company ID...\n');
  
  const usersWithFallback = await prisma.user.findMany({
    where: { whopCompanyId: '9nmw5yleoqldrxf7n48c' },
    select: { 
      id: true, 
      email: true, 
      whopUserId: true, 
      whopCompanyId: true, 
      createdAt: true,
      role: true 
    }
  });
  
  console.log(`📊 Users with fallback ID (${usersWithFallback.length}):`);
  usersWithFallback.forEach((user, index) => {
    console.log(`${index + 1}. User ID: ${user.whopUserId}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Company ID: ${user.whopCompanyId}\n`);
  });

  // Check if any new users were created recently
  const recentUsers = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    orderBy: { createdAt: 'desc' },
    select: { 
      id: true, 
      email: true, 
      whopUserId: true, 
      whopCompanyId: true, 
      createdAt: true,
      role: true 
    }
  });

  console.log(`\n🕐 Recent users (last 24h): ${recentUsers.length}`);
  recentUsers.forEach((user, index) => {
    console.log(`${index + 1}. User ID: ${user.whopUserId}`);
    console.log(`   Company ID: ${user.whopCompanyId}`);
    console.log(`   Created: ${user.createdAt}\n`);
  });

  await prisma.$disconnect();
}

checkCurrentUsers().catch(console.error);