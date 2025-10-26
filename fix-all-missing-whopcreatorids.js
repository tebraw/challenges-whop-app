const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllChallenges() {
  console.log('\n=== FIXING ALL CHALLENGES WITH MISSING whopCreatorId ===\n');
  
  // Find all challenges with null whopCreatorId but with a creator
  const challengesToFix = await prisma.challenge.findMany({
    where: {
      whopCreatorId: null,
      creatorId: { not: null }
    },
    include: {
      creator: {
        select: {
          id: true,
          whopUserId: true,
          name: true
        }
      }
    }
  });

  console.log(`Found ${challengesToFix.length} challenges to fix\n`);

  let fixed = 0;
  let skipped = 0;

  for (const challenge of challengesToFix) {
    if (challenge.creator && challenge.creator.whopUserId) {
      console.log(`Fixing challenge "${challenge.title}" (${challenge.id})`);
      console.log(`  Setting whopCreatorId: ${challenge.creator.whopUserId}`);
      
      await prisma.challenge.update({
        where: { id: challenge.id },
        data: {
          whopCreatorId: challenge.creator.whopUserId
        }
      });
      
      fixed++;
    } else {
      console.log(`⚠️  Skipping challenge "${challenge.title}" - creator has no whopUserId`);
      skipped++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`✅ Fixed: ${fixed} challenges`);
  console.log(`⚠️  Skipped: ${skipped} challenges (creator has no whopUserId)`);

  await prisma.$disconnect();
}

fixAllChallenges().catch(console.error);
