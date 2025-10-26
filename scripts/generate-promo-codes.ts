import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate cryptographically secure random code
function generatePromoCode(): string {
  // Characters to use (excluding similar-looking: 0/O, 1/I, l)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part3 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  
  return `BETA-${part1}-${part2}-${part3}`;
}

// Ensure code is unique
async function generateUniqueCode(): Promise<string> {
  let code = generatePromoCode();
  let existing = await prisma.promoCode.findUnique({ where: { code } });
  
  // Keep generating until we find a unique one
  while (existing) {
    code = generatePromoCode();
    existing = await prisma.promoCode.findUnique({ where: { code } });
  }
  
  return code;
}

async function main() {
  console.log('🎟️  Generating 100 Promo Codes...\n');
  
  const codes: string[] = [];
  const codeCount = 100;
  
  // Generate codes in batches for better performance
  for (let i = 0; i < codeCount; i++) {
    const code = await generateUniqueCode();
    codes.push(code);
    
    // Create in database
    await prisma.promoCode.create({
      data: {
        code,
        tier: 'Starter',
        isActive: true,
        // Optional: Set expiration to 90 days from now
        // validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    });
    
    if ((i + 1) % 10 === 0) {
      console.log(`✅ Generated ${i + 1}/${codeCount} codes...`);
    }
  }
  
  console.log('\n✨ ALL CODES GENERATED!\n');
  console.log('=' .repeat(60));
  console.log('📋 COPY THESE CODES (100 total):');
  console.log('=' .repeat(60));
  console.log('\n');
  
  // Print all codes in a copyable format
  codes.forEach((code, index) => {
    console.log(`${(index + 1).toString().padStart(3, ' ')}. ${code}`);
  });
  
  console.log('\n');
  console.log('=' .repeat(60));
  console.log('💾 Codes saved to database!');
  console.log('🔒 Each code can only be used once');
  console.log('🎯 Grants: ProPlus tier access');
  console.log('=' .repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
