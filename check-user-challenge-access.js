const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserAndChallenge() {
  try {
    // Check the challenge and its tenant
    const challenge = await prisma.challenge.findUnique({
      where: { id: 'cmfjo1i0600092nh18tcek0cg' },
      include: { 
        tenant: true,
        enrollments: {
          include: { user: true }
        }
      }
    });
    
    console.log('📋 Challenge Info:');
    console.log('ID:', challenge?.id);
    console.log('Title:', challenge?.title);
    console.log('Tenant ID:', challenge?.tenant?.id);
    console.log('Tenant whopCompanyId:', challenge?.tenant?.whopCompanyId);
    console.log('Enrollments count:', challenge?.enrollments?.length);
    
    // Check if there are any users with the same company
    const usersInSameCompany = await prisma.user.findMany({
      where: { whopCompanyId: challenge?.tenant?.whopCompanyId },
      include: { tenant: true }
    });
    
    console.log('\n👥 Users in same company:');
    usersInSameCompany.forEach(user => {
      console.log(`- ${user.whopUserId} (${user.role}) - Company: ${user.whopCompanyId}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAndChallenge();