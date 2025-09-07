#!/usr/bin/env node

/**
 * Script to update existing challenges for marketplace
 * Makes all existing challenges public and categorizes them
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simplified categorization logic
function categorizeChallenge(challenge, tenant) {
  const title = challenge.title?.toLowerCase() || '';
  const description = challenge.description?.toLowerCase() || '';
  const companyName = tenant?.name?.toLowerCase() || '';
  
  const content = `${title} ${description} ${companyName}`;
  
  // Simple keyword-based categorization
  if (content.includes('fitness') || content.includes('workout') || content.includes('exercise') || content.includes('sport')) {
    return 'fitness';
  } else if (content.includes('tech') || content.includes('programming') || content.includes('code') || content.includes('software')) {
    return 'tech';
  } else if (content.includes('creative') || content.includes('art') || content.includes('design') || content.includes('music')) {
    return 'creative';
  } else if (content.includes('business') || content.includes('entrepreneur') || content.includes('startup')) {
    return 'business';
  } else if (content.includes('learn') || content.includes('education') || content.includes('study') || content.includes('skill')) {
    return 'learning';
  } else if (content.includes('social') || content.includes('community') || content.includes('network')) {
    return 'social';
  } else if (content.includes('game') || content.includes('gaming') || content.includes('play')) {
    return 'gaming';
  } else if (content.includes('health') || content.includes('wellness') || content.includes('mental')) {
    return 'health';
  } else if (content.includes('travel') || content.includes('adventure') || content.includes('explore')) {
    return 'travel';
  } else {
    return 'personal';
  }
}

async function updateExistingChallenges() {
  console.log('🔍 Updating existing challenges for marketplace...\n');

  try {
    // Get all challenges (simplified query)
    const challenges = await prisma.challenge.findMany({
      include: {
        tenant: true
      }
    });

    console.log(`📊 Found ${challenges.length} challenges to update`);

    if (challenges.length === 0) {
      console.log('✅ No challenges found!');
      return;
    }

    for (const challenge of challenges) {
      console.log(`\n📝 Updating: "${challenge.title}"`);
      
      // Auto-categorize the challenge
      const category = categorizeChallenge(challenge, challenge.tenant);
      
      // Determine difficulty based on existing data
      let difficulty = 'INTERMEDIATE'; // Default
      if (challenge.description && challenge.description.toLowerCase().includes('beginner')) {
        difficulty = 'BEGINNER';
      } else if (challenge.description && challenge.description.toLowerCase().includes('advanced')) {
        difficulty = 'ADVANCED';
      }

      // Update the challenge
      await prisma.challenge.update({
        where: { id: challenge.id },
        data: {
          isPublic: true,        // Make all existing challenges public
          category: category,    // Auto-categorize
          difficulty: difficulty, // Set default difficulty
          featured: false        // Not featured by default
        }
      });

      console.log(`  ✅ Category: ${category}, Difficulty: ${difficulty}, Public: true`);
    }

    console.log(`\n🎉 Successfully updated ${challenges.length} challenges!`);
    console.log('📍 All your challenges should now be visible in the marketplace');

  } catch (error) {
    console.error('❌ Error updating challenges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateExistingChallenges();
