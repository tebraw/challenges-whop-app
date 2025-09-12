const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixChallengeCompany() {
  try {
    console.log('🔍 Checking challenge company assignment...');
    
    // Find the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: 'cmf9u8sis000451fk3d5xvpet' },
      include: { 
        tenant: true,
        creator: true 
      }
    });
    
    if (!challenge) {
      console.log('❌ Challenge not found!');
      return;
    }
    
    console.log('📋 Current challenge data:', {
      id: challenge.id,
      title: challenge.title,
      tenantWhopCompanyId: challenge.tenant?.whopCompanyId,
      creatorWhopCompanyId: challenge.creator?.whopCompanyId
    });
    
    // User's company ID from the logs
    const userCompanyId = '9nmw5yleoqldrxf7n48c';
    
    // Update the tenant with the correct whopCompanyId
    if (challenge.tenant && !challenge.tenant.whopCompanyId) {
      console.log('🔧 Updating tenant with whopCompanyId...');
      await prisma.tenant.update({
        where: { id: challenge.tenantId },
        data: { whopCompanyId: userCompanyId }
      });
      console.log('✅ Tenant updated successfully!');
    }
    
    // Update the creator with the correct whopCompanyId if needed
    if (challenge.creator && !challenge.creator.whopCompanyId) {
      console.log('🔧 Updating creator with whopCompanyId...');
      await prisma.user.update({
        where: { id: challenge.creatorId },
        data: { whopCompanyId: userCompanyId }
      });
      console.log('✅ Creator updated successfully!');
    }
    
    // Verify the fix
    const updatedChallenge = await prisma.challenge.findUnique({
      where: { id: 'cmf9u8sis000451fk3d5xvpet' },
      include: { 
        tenant: true,
        creator: true 
      }
    });
    
    console.log('🎉 Updated challenge data:', {
      id: updatedChallenge.id,
      title: updatedChallenge.title,
      tenantWhopCompanyId: updatedChallenge.tenant?.whopCompanyId,
      creatorWhopCompanyId: updatedChallenge.creator?.whopCompanyId
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixChallengeCompany();
