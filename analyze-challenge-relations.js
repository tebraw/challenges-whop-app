/**
 * 🔍 ANALYZE CHALLENGE RELATIONS SIZE
 * Checks if the problem is with relations (enrollments, offers, etc.)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeChallengeRelations() {
  try {
    console.log('🔍 Analyzing Challenge Relations...\n');

    // Get challenges with their relation counts
    const challenges = await prisma.challenge.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            enrollments: true,
            challengeOffers: true,
            winners: true,
            notifications: true,
            conversions: true,
            revenueShares: true
          }
        }
      }
    });

    console.log(`📊 Total Challenges: ${challenges.length}\n`);

    let totalEnrollments = 0;
    let totalOffers = 0;
    let totalWinners = 0;
    let totalNotifications = 0;
    let totalConversions = 0;
    let totalRevenueShares = 0;

    challenges.forEach(challenge => {
      const counts = challenge._count;
      const total = counts.enrollments + counts.challengeOffers + counts.winners + 
                    counts.notifications + counts.conversions + counts.revenueShares;

      totalEnrollments += counts.enrollments;
      totalOffers += counts.challengeOffers;
      totalWinners += counts.winners;
      totalNotifications += counts.notifications;
      totalConversions += counts.conversions;
      totalRevenueShares += counts.revenueShares;

      if (total > 10) {
        console.log(`⚠️ Challenge: "${challenge.title}"`);
        console.log(`   Total Relations: ${total}`);
        if (counts.enrollments > 0) console.log(`     - Enrollments: ${counts.enrollments}`);
        if (counts.challengeOffers > 0) console.log(`     - Offers: ${counts.challengeOffers}`);
        if (counts.winners > 0) console.log(`     - Winners: ${counts.winners}`);
        if (counts.notifications > 0) console.log(`     - Notifications: ${counts.notifications}`);
        if (counts.conversions > 0) console.log(`     - Conversions: ${counts.conversions}`);
        if (counts.revenueShares > 0) console.log(`     - Revenue Shares: ${counts.revenueShares}`);
        console.log('');
      }
    });

    console.log('\n📊 TOTAL RELATIONS:');
    console.log(`Enrollments: ${totalEnrollments}`);
    console.log(`Challenge Offers: ${totalOffers}`);
    console.log(`Winners: ${totalWinners}`);
    console.log(`Notifications: ${totalNotifications}`);
    console.log(`Conversions: ${totalConversions}`);
    console.log(`Revenue Shares: ${totalRevenueShares}`);
    console.log(`GRAND TOTAL: ${totalEnrollments + totalOffers + totalWinners + totalNotifications + totalConversions + totalRevenueShares}`);

    // Check individual table sizes
    console.log('\n💾 CHECKING INDIVIDUAL TABLE SIZES...');
    
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `;

    console.log('\nTop 10 Largest Tables:');
    tableSizes.forEach((table, index) => {
      console.log(`${index + 1}. ${table.tablename}: ${table.size}`);
    });

    // Check if Enrollments table has proofs causing size
    const enrollmentCount = await prisma.enrollment.count();
    const proofCount = await prisma.proof.count();
    const checkinCount = await prisma.checkin.count();

    console.log('\n📊 RELATED DATA COUNTS:');
    console.log(`Enrollments: ${enrollmentCount}`);
    console.log(`Proofs: ${proofCount}`);
    console.log(`Check-ins: ${checkinCount}`);

    if (proofCount > 100) {
      console.log('\n🚨 POTENTIAL ISSUE: Large number of proofs!');
      console.log('Proofs table may contain image URLs or large data causing query timeouts.');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    
    if (error.message.includes('Bad Request')) {
      console.log('\n🚨 CRITICAL: Even counting relations triggers Bad Request!');
      console.log('The problem is definitely response size related.');
      console.log('\nLIKELY CAUSE: Prisma Accelerate is trying to fetch ALL relations');
      console.log('when counting, causing response to exceed 10 MiB limit.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

analyzeChallengeRelations();