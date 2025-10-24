// generate-thumbnails-for-existing-challenges.js
/**
 * Generate thumbnails for all existing challenges
 * This is a ONE-TIME migration script - safe to run multiple times
 * 
 * SAFETY:
 * - Never deletes or modifies original imageUrl
 * - Only creates imageUrlThumbnail if it doesn't exist
 * - Can be re-run safely - skips challenges that already have thumbnails
 */

import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const prisma = new PrismaClient();

// Thumbnail configuration
const THUMBNAIL_CONFIG = {
  width: 400,
  height: 225,
  quality: 75,
  format: 'webp'
};

/**
 * Convert base64 data URL to buffer
 */
function dataUrlToBuffer(dataUrl) {
  if (!dataUrl.startsWith('data:image/')) {
    throw new Error('Not a valid image data URL');
  }
  
  const base64Data = dataUrl.split(',')[1];
  if (!base64Data) {
    throw new Error('Invalid data URL format');
  }
  
  return Buffer.from(base64Data, 'base64');
}

/**
 * Generate thumbnail from base64 data URL using sharp
 */
async function generateThumbnail(dataUrl) {
  try {
    // Convert data URL to buffer
    const buffer = dataUrlToBuffer(dataUrl);
    
    // Process with sharp (much faster and better quality than canvas)
    const thumbnailBuffer = await sharp(buffer)
      .resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: THUMBNAIL_CONFIG.quality })
      .toBuffer();
    
    // Convert back to data URL
    const base64Thumbnail = thumbnailBuffer.toString('base64');
    const thumbnailDataUrl = `data:image/webp;base64,${base64Thumbnail}`;
    
    return thumbnailDataUrl;
  } catch (error) {
    console.error('❌ Thumbnail generation failed:', error.message);
    return null;
  }
}

/**
 * Calculate size reduction
 */
function calculateReduction(original, thumbnail) {
  const reduction = ((original.length - thumbnail.length) / original.length * 100).toFixed(1);
  const originalKB = (original.length / 1024).toFixed(1);
  const thumbnailKB = (thumbnail.length / 1024).toFixed(1);
  return { reduction, originalKB, thumbnailKB };
}

async function main() {
  console.log('🚀 Starting thumbnail generation for existing challenges...\n');
  
  // Get all challenges that have imageUrl but no imageUrlThumbnail
  const challengesNeedingThumbnails = await prisma.challenge.findMany({
    where: {
      AND: [
        { imageUrl: { not: null } },
        { imageUrlThumbnail: null }
      ]
    },
    select: {
      id: true,
      title: true,
      imageUrl: true
    }
  });
  
  console.log(`📊 Found ${challengesNeedingThumbnails.length} challenges needing thumbnails\n`);
  
  if (challengesNeedingThumbnails.length === 0) {
    console.log('✅ All challenges already have thumbnails!');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  let totalOriginalSize = 0;
  let totalThumbnailSize = 0;
  
  // Process each challenge
  for (const challenge of challengesNeedingThumbnails) {
    console.log(`\n📸 Processing: "${challenge.title.substring(0, 50)}..."`);
    
    try {
      // Generate thumbnail
      const thumbnail = await generateThumbnail(challenge.imageUrl);
      
      if (!thumbnail) {
        console.log(`   ⚠️  Skipped - could not generate thumbnail`);
        failCount++;
        continue;
      }
      
      // Calculate size reduction
      const stats = calculateReduction(challenge.imageUrl, thumbnail);
      totalOriginalSize += parseInt(stats.originalKB);
      totalThumbnailSize += parseInt(stats.thumbnailKB);
      
      console.log(`   ✅ Generated thumbnail:`);
      console.log(`      Original: ${stats.originalKB} KB`);
      console.log(`      Thumbnail: ${stats.thumbnailKB} KB`);
      console.log(`      Reduction: ${stats.reduction}%`);
      
      // Update database - ONLY set imageUrlThumbnail, NEVER touch imageUrl
      await prisma.challenge.update({
        where: { id: challenge.id },
        data: {
          imageUrlThumbnail: thumbnail
        }
      });
      
      successCount++;
      
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
      failCount++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📏 Total original size: ${totalOriginalSize} KB`);
  console.log(`📏 Total thumbnail size: ${totalThumbnailSize} KB`);
  console.log(`💾 Total saved: ${totalOriginalSize - totalThumbnailSize} KB`);
  console.log(`📉 Average reduction: ${((1 - totalThumbnailSize / totalOriginalSize) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  console.log('\n✅ Migration complete! All original images are safe.');
  console.log('🔍 Discover page will now load much faster!\n');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
