// quick-test-discover-query.js
/**
 * Quick test to see if discover query works
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Discover Page Query...\n');
  
  try {
    const challenges = await prisma.challenge.findMany({
      where: {
        isPublic: true,
        endAt: { gt: new Date() }
      },
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        featured: true,
        difficulty: true,
        tenantId: true,
        imageUrlThumbnail: true,
        tenant: {
          select: {
            id: true,
            name: true,
            whopCompanyId: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 100
    });
    
    console.log(`✅ Query successful!`);
    console.log(`📊 Challenges found: ${challenges.length}`);
    console.log(`📷 With thumbnails: ${challenges.filter(c => c.imageUrlThumbnail).length}`);
    console.log(`🏢 Tenants: ${[...new Set(challenges.map(c => c.tenantId))].length}`);
    
    const sizeEstimate = Buffer.from(JSON.stringify(challenges)).length / 1024 / 1024;
    console.log(`📦 Estimated size: ${sizeEstimate.toFixed(2)} MB`);
    
    if (sizeEstimate > 10) {
      console.log(`⚠️  WARNING: Exceeds 10 MB limit!`);
    } else {
      console.log(`✅ Under 10 MB limit`);
    }
    
  } catch (error) {
    console.error('❌ Query failed:', error);
    console.error('Error details:', error.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
