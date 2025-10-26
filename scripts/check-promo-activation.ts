import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking promo code activations...\n');
  
  // Find all used promo codes
  const usedCodes = await prisma.promoCode.findMany({
    where: {
      usedBy: { not: null }
    },
    include: {
      // We'll manually fetch the user since relation might not exist yet
    }
  });
  
  console.log(`Found ${usedCodes.length} activated promo code(s):\n`);
  
  for (const code of usedCodes) {
    console.log('📋 Promo Code:', code.code);
    console.log('   Used By (userId):', code.usedBy);
    console.log('   Tier Granted:', code.tier);
    console.log('   Activated At:', code.usedAt);
    console.log('   Is Active:', code.isActive);
    
    // Find the user
    if (code.usedBy) {
      const user = await prisma.user.findUnique({
        where: { id: code.usedBy },
        select: {
          id: true,
          email: true,
          whopUserId: true,
          activePromoCode: true,
          tier: true
        }
      });
      
      if (user) {
        console.log('   👤 User Email:', user.email);
        console.log('   👤 Whop User ID:', user.whopUserId);
        console.log('   👤 Current Tier:', user.tier);
        console.log('   👤 Active Promo Code in DB:', user.activePromoCode);
        
        if (user.activePromoCode !== code.code) {
          console.log('   ⚠️  WARNING: User activePromoCode does not match!');
        }
      } else {
        console.log('   ❌ User not found in database!');
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
