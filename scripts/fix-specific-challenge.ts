/**
 * Quick Fix: Update specific challenge with whopCreatorId
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function fixChallenge() {
  const challengeId = 'cmh7rd4hv001dybfmrtmjha3s';
  const creatorId = 'cmg5ekpvq000i1nea90e1m2tk';
  
  try {
    console.log('🔍 Looking up challenge and creator...\n');
    
    // Get challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
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
    
    if (!challenge) {
      console.log('❌ Challenge not found!');
      return;
    }
    
    console.log('📋 Challenge:', challenge.title);
    console.log('👤 Creator:', challenge.creator?.email);
    console.log('🆔 Creator Internal ID:', challenge.creator?.id);
    console.log('🆔 Creator Whop User ID:', challenge.creator?.whopUserId || '⚠️ MISSING!');
    console.log('🆔 Current Challenge whopCreatorId:', challenge.whopCreatorId || '⚠️ NULL');
    
    if (!challenge.creator?.whopUserId) {
      console.log('\n❌ ERROR: Creator has no whopUserId! Cannot fix.');
      console.log('This user needs to be re-initialized via /api/auth/init-user');
      return;
    }
    
    console.log('\n🔧 Updating challenge...');
    
    await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        whopCreatorId: challenge.creator.whopUserId
      }
    });
    
    console.log('✅ SUCCESS! Challenge updated with whopCreatorId:', challenge.creator.whopUserId);
    console.log('\n💡 Next payment will now trigger revenue distribution!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixChallenge();
