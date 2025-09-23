const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugChallengeDetails() {
  console.log('🔍 DEBUGGING CHALLENGE VISIBILITY');
  console.log('===================================');
  
  const challenge = await prisma.challenge.findFirst({
    where: { 
      tenantId: 'cmfwvpoy500052bfjgioc6wcm' 
    },
    include: {
      tenant: true,
      _count: {
        select: {
          enrollments: true
        }
      },
      enrollments: {
        where: {
          user: {
            whopUserId: 'user_4CUq7XKZv98Zy'
          }
        }
      }
    }
  });
  
  if (challenge) {
    console.log('📊 CHALLENGE DETAILS:');
    console.log(`- Title: ${challenge.title}`);
    console.log(`- ID: ${challenge.id}`);
    console.log(`- Tenant: ${challenge.tenantId}`);
    console.log(`- Company: ${challenge.tenant?.whopCompanyId}`);
    console.log(`- Created: ${challenge.createdAt}`);
    console.log(`- Start: ${challenge.startAt}`);
    console.log(`- End: ${challenge.endAt}`);
    console.log(`- Now: ${new Date()}`);
    console.log(`- Has ended: ${challenge.endAt < new Date()}`);
    console.log(`- Total enrollments: ${challenge._count.enrollments}`);
    console.log(`- User enrolled: ${challenge.enrollments.length > 0}`);
  } else {
    console.log('❌ No challenge found for tenant cmfwvpoy500052bfjgioc6wcm');
  }
  
  await prisma.$disconnect();
}

debugChallengeDetails().catch(console.error);