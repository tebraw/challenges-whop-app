const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRevenueShares() {
  console.log('\n=== CHECKING REVENUE SHARE RECORDS ===\n');
  
  const revenueShares = await prisma.revenueShare.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      challenge: {
        select: {
          id: true,
          title: true
        }
      },
      creator: {
        select: {
          id: true,
          name: true,
          whopUserId: true
        }
      }
    }
  });

  console.log(`Found ${revenueShares.length} revenue share records\n`);

  if (revenueShares.length === 0) {
    console.log('❌ NO REVENUE SHARE RECORDS FOUND!');
    console.log('This means the webhook is NOT triggering revenue distribution!\n');
    console.log('Possible causes:');
    console.log('1. Webhook is not being called by Whop');
    console.log('2. Webhook condition is failing');
    console.log('3. distributeRevenue() is not being called');
  } else {
    revenueShares.forEach((share, index) => {
      console.log(`${index + 1}. Challenge: ${share.challenge?.title || 'Unknown'}`);
      console.log(`   Revenue Share ID: ${share.id}`);
      console.log(`   Created At: ${share.createdAt}`);
      console.log(`   Status: ${share.status}`);
      console.log(`   Creator: ${share.creator?.name || 'Unknown'} (${share.whopCreatorId})`);
      console.log(`   Amount: $${(share.amount / 100).toFixed(2)}`);
      console.log(`   Platform Fee: $${(share.platformFee / 100).toFixed(2)}`);
      console.log(`   Payment ID: ${share.paymentId}`);
      console.log(`   Transfer ID: ${share.transferId || 'N/A'}`);
      console.log(`   Retry Count: ${share.retryCount}`);
      console.log(`   Error: ${share.errorMessage || 'None'}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkRevenueShares().catch(console.error);
