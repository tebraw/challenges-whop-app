/**
 * Fix Missing whopCreatorId in Challenges
 * 
 * This script updates all challenges that are missing whopCreatorId
 * by looking up the creator's whopUserId from the User table
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function fixMissingWhopCreatorIds() {
  try {
    console.log('🔍 Searching for challenges without whopCreatorId...\n');

    // Find all challenges where whopCreatorId is null or empty
    const challengesWithoutWhopId = await prisma.challenge.findMany({
      where: {
        OR: [
          { whopCreatorId: null },
          { whopCreatorId: '' }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            whopUserId: true
          }
        }
      }
    });

    console.log(`📊 Found ${challengesWithoutWhopId.length} challenges without whopCreatorId\n`);

    if (challengesWithoutWhopId.length === 0) {
      console.log('✅ All challenges already have whopCreatorId set!');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const challenge of challengesWithoutWhopId) {
      const whopUserId = challenge.creator?.whopUserId;

      if (!whopUserId) {
        console.log(`⚠️ SKIP: Challenge "${challenge.title}" (${challenge.id})`);
        console.log(`   Reason: Creator has no whopUserId`);
        console.log(`   Creator: ${challenge.creator?.email || 'unknown'}\n`);
        skippedCount++;
        continue;
      }

      console.log(`🔧 UPDATING: Challenge "${challenge.title}" (${challenge.id})`);
      console.log(`   Creator: ${challenge.creator?.email || 'unknown'}`);
      console.log(`   Setting whopCreatorId: ${whopUserId}`);

      await prisma.challenge.update({
        where: { id: challenge.id },
        data: {
          whopCreatorId: whopUserId
        }
      });

      console.log(`   ✅ Updated!\n`);
      updatedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`   Total challenges found: ${challengesWithoutWhopId.length}`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⚠️ Skipped: ${skippedCount}`);
    console.log('='.repeat(60));

    if (updatedCount > 0) {
      console.log('\n🎉 SUCCESS! All challenges now have whopCreatorId for revenue distribution!');
    }

  } catch (error) {
    console.error('❌ Error fixing whopCreatorIds:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixMissingWhopCreatorIds()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
