const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDatabaseData() {
  console.log('🔍 Analyzing database for winners page issues...\n');
  
  try {
    // Get latest challenges
    const latestChallenges = await prisma.challenge.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            proofs: true
          }
        }
      }
    });

    console.log(`📊 Found ${latestChallenges.length} latest challenges\n`);

    for (const challenge of latestChallenges) {
      console.log(`🎯 Challenge: "${challenge.title}" (ID: ${challenge.id})`);
      console.log(`   Cadence: ${challenge.cadence}, Proof Type: ${challenge.proofType}`);
      console.log(`   Start: ${challenge.startAt}, End: ${challenge.endAt}`);
      console.log(`   Enrollments: ${challenge.enrollments.length}`);
      
      if (challenge.enrollments.length > 0) {
        console.log(`\n   📋 Enrollment Details:`);
        
        for (const enrollment of challenge.enrollments) {
          console.log(`   👤 User: ${enrollment.user.name || enrollment.user.email} (ID: ${enrollment.user.id})`);
          console.log(`      Enrollment ID: ${enrollment.id}`);
          console.log(`      Joined: ${enrollment.joinedAt}`);
          console.log(`      Proofs: ${enrollment.proofs.length}`);
          
          if (enrollment.proofs.length > 0) {
            enrollment.proofs.forEach((proof, index) => {
              console.log(`         Proof ${index + 1}: Type=${proof.type}, Text="${proof.text}", URL="${proof.url}", Created=${proof.createdAt}`);
            });
          } else {
            console.log(`         ❌ No proofs found`);
          }
          console.log('');
        }
      } else {
        console.log(`   ❌ No enrollments found\n`);
      }
      
      console.log('─'.repeat(80) + '\n');
    }

    // Check for any orphaned data
    console.log('🔍 Checking for data consistency issues...\n');

// Check for proofs without enrollments
const orphanedProofs = await prisma.proof.findMany({
  where: {
    enrollment: {
      is: null
    }
  }
});    if (orphanedProofs.length > 0) {
      console.log(`⚠️ Found ${orphanedProofs.length} orphaned proofs (no enrollment)`);
      orphanedProofs.forEach(proof => {
        console.log(`   Proof ID: ${proof.id}, Enrollment ID: ${proof.enrollmentId}`);
      });
    } else {
      console.log('✅ No orphaned proofs found');
    }

    // Check for enrollments without users
    const enrollmentsWithoutUsers = await prisma.enrollment.findMany({
      where: {
        userId: null
      }
    });
    
    if (enrollmentsWithoutUsers.length > 0) {
      console.log(`⚠️ Found ${enrollmentsWithoutUsers.length} enrollments without users`);
    } else {
      console.log('✅ All enrollments have valid users');
    }

    console.log('\n🏁 Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error analyzing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDatabaseData();