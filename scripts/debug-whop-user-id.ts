import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const whopUserId = 'user_oushijHL1QnTx'; // From previous check
  
  console.log('🔍 Looking for user with whopUserId:', whopUserId);
  
  const user = await prisma.user.findFirst({
    where: { whopUserId },
    select: {
      id: true,
      email: true,
      whopUserId: true,
      activePromoCode: true,
      tier: true
    }
  });
  
  if (user) {
    console.log('✅ Found user:');
    console.log('   Internal ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Whop User ID:', user.whopUserId);
    console.log('   Active Promo Code:', user.activePromoCode);
    console.log('   Current Tier:', user.tier);
  } else {
    console.log('❌ User NOT found!');
  }
  
  // Also check what whopUserId values exist
  console.log('\n📋 All users with promo codes:');
  const allUsersWithPromo = await prisma.user.findMany({
    where: {
      activePromoCode: { not: null }
    },
    select: {
      id: true,
      email: true,
      whopUserId: true,
      activePromoCode: true
    }
  });
  
  console.log('Found', allUsersWithPromo.length, 'user(s) with promo codes:');
  allUsersWithPromo.forEach(u => {
    console.log(`  - ${u.email}: whopUserId="${u.whopUserId}", promoCode="${u.activePromoCode}"`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
