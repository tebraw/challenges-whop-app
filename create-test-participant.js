// Create test participant user for testing participant routing

const { PrismaClient } = require('@prisma/client');

async function createTestParticipant() {
  const prisma = new PrismaClient();
  
  try {
    console.log('👤 Creating test participant user...\n');
    
    // Get the tenant
    const tenant = await prisma.tenant.findFirst({
      where: { whopCompanyId: '9nmw5yleoqldrxf7n48c' }
    });
    
    if (!tenant) {
      console.log('❌ No tenant found');
      return;
    }
    
    // Create test participant user
    const testUser = await prisma.user.upsert({
      where: { email: 'participant@test.local' },
      update: {
        role: 'USER',
        whopCompanyId: '9nmw5yleoqldrxf7n48c',
        tenantId: tenant.id
      },
      create: {
        email: 'participant@test.local',
        name: 'Test Participant',
        role: 'USER',
        whopCompanyId: '9nmw5yleoqldrxf7n48c',
        tenantId: tenant.id
      }
    });
    
    console.log(`✅ Test participant created: ${testUser.email} (ID: ${testUser.id})`);
    
    // Get test challenge
    const challenge = await prisma.challenge.findFirst();
    
    if (challenge) {
      // Enroll test user in challenge
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          userId: testUser.id,
          challengeId: challenge.id
        }
      });
      
      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            userId: testUser.id,
            challengeId: challenge.id,
            joinedAt: new Date()
          }
        });
        console.log(`🎯 Test participant enrolled in challenge: ${challenge.title}`);
      } else {
        console.log(`🎯 Test participant already enrolled in challenge: ${challenge.title}`);
      }
      console.log(`📍 Expected route for this user: /c/${challenge.id}/participate`);
      
      console.log('\n🧪 Test Setup Complete!');
      console.log('Now you can test with this user to see participant routing.');
      console.log('Use dev login or Whop auth with participant@test.local');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestParticipant();
