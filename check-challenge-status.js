const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkChallenge() {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: 'cmfjo1i0600092nh18tcek0cg' },
      include: { tenant: true }
    });
    
    console.log('📋 Challenge Check:');
    console.log('Found:', !!challenge);
    console.log('ID:', challenge?.id);
    console.log('Title:', challenge?.title);
    console.log('isPublic:', challenge?.isPublic);
    console.log('Tenant ID:', challenge?.tenant?.id);
    console.log('Tenant whopCompanyId:', challenge?.tenant?.whopCompanyId);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChallenge();