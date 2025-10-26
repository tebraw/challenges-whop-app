import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating all ProPlus/Professional promo codes to Starter tier...\n');
  
  // Update all existing promo codes from Professional to Starter
  const result = await prisma.promoCode.updateMany({
    where: {
      OR: [
        { tier: 'Professional' },
        { tier: 'ProPlus' }
      ]
    },
    data: {
      tier: 'Starter'
    }
  });
  
  console.log(`✅ Updated ${result.count} promo codes to Starter tier\n`);
  
  // Show current status
  const allCodes = await prisma.promoCode.findMany({
    select: {
      code: true,
      tier: true,
      isActive: true,
      usedBy: true
    },
    take: 10
  });
  
  console.log('📋 Sample of first 10 promo codes:');
  console.log('=' .repeat(60));
  allCodes.forEach(code => {
    const status = code.usedBy ? '🔴 USED' : (code.isActive ? '🟢 ACTIVE' : '⚪ INACTIVE');
    console.log(`${status} ${code.code} → Tier: ${code.tier}`);
  });
  console.log('=' .repeat(60));
  
  const stats = await prisma.promoCode.groupBy({
    by: ['tier', 'isActive'],
    _count: true
  });
  
  console.log('\n📊 Statistics:');
  stats.forEach(stat => {
    const status = stat.isActive ? 'Active' : 'Inactive';
    console.log(`  ${stat.tier} (${status}): ${stat._count} codes`);
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
