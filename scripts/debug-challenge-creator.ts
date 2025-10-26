/**
 * Debug Challenge Creator - Check why whopCreatorId is null
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function debugChallengeCreator() {
  try {
    const challengeId = 'cmh7rd4hv001dybfmrtmjha3s';
    
    console.log('🔍 Checking challenge and creator...\n');

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: true
      }
    });

    if (!challenge) {
      console.log('❌ Challenge not found!');
      return;
    }

    console.log('📋 CHALLENGE INFO:');
    console.log('   ID:', challenge.id);
    console.log('   Title:', challenge.title);
    console.log('   Creator ID:', challenge.creatorId);
    console.log('   Whop Creator ID:', challenge.whopCreatorId);
    console.log('   Created At:', challenge.createdAt);
    console.log('');

    console.log('👤 CREATOR INFO:');
    console.log('   Internal ID:', challenge.creator?.id);
    console.log('   Email:', challenge.creator?.email);
    console.log('   Name:', challenge.creator?.name);
    console.log('   Whop User ID:', challenge.creator?.whopUserId);
    console.log('   Whop Company ID:', challenge.creator?.whopCompanyId);
    console.log('   Role:', challenge.creator?.role);
    console.log('   Created At:', challenge.creator?.createdAt);
    console.log('');

    if (!challenge.creator?.whopUserId) {
      console.log('❌ PROBLEM FOUND: Creator has NO whopUserId!');
      console.log('   This is why whopCreatorId is null in the challenge.');
      console.log('   Revenue distribution will fail because we need whopUserId to pay the creator.');
      console.log('');
      console.log('💡 SOLUTION: The creator needs to be re-initialized with whopUserId.');
      console.log('   This should happen automatically on next login/action.');
    } else {
      console.log('✅ Creator HAS whopUserId:', challenge.creator.whopUserId);
      console.log('   But challenge.whopCreatorId is still null!');
      console.log('   The challenge was created before the fix was deployed.');
      console.log('');
      console.log('💡 SOLUTION: Update this specific challenge with:');
      console.log(`   UPDATE Challenge SET whopCreatorId = '${challenge.creator.whopUserId}' WHERE id = '${challenge.id}'`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChallengeCreator();
