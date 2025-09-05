// scripts/create-full-test-challenge.js
// Erstellt eine vollständige Test-Challenge für umfassendes Testing

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestChallenge() {
  try {
    console.log('🎯 Creating comprehensive test challenge...');
    
    // Create or get tenant first
    const tenant = await prisma.tenant.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        name: 'Default Tenant'
      }
    });
    
    console.log(`🏢 Using tenant: ${tenant.name}`);
    
    // Create test challenge with all features
    const challenge = await prisma.challenge.create({
      data: {
        title: 'Complete Feature Test Challenge',
        description: 'This challenge tests all app functionality including Whop integration, special offers, winner selection, and user experience.',
        startAt: new Date(Date.now() - 86400000), // Started yesterday
        endAt: new Date(Date.now() + 7 * 86400000), // Ends in 7 days
        proofType: 'TEXT',
        cadence: 'DAILY',
        imageUrl: '/logo-mark.png',
        tenantId: tenant.id,
        rules: {
          policy: 'This is a comprehensive test challenge. Winners will be selected based on engagement, consistency, and quality of submissions. All participants must follow community guidelines.',
          rewards: [
            {
              place: 1,
              title: 'Grand Prize Winner - $500 Cash',
              desc: 'Cash prize for the ultimate challenge champion'
            },
            {
              place: 2,
              title: 'Second Place - $200 Gift Card',
              desc: 'Amazon gift card for excellent performance'
            },
            {
              place: 3,
              title: 'Third Place - $100 Voucher',
              desc: 'Store voucher for great effort'
            }
          ]
        },
        monetizationRules: {
          enabled: true,
          offers: [
            {
              id: 'completion_offer_premium',
              type: 'completion',
              productName: 'Premium Coaching Program',
              originalPrice: 297,
              discountPercentage: 30,
              timeLimit: 72,
              customMessage: 'Congratulations on completing the challenge! Get 30% off our Premium Coaching Program!',
              checkoutUrl: 'https://whop.com/checkout/premium-coaching'
            },
            {
              id: 'mid_challenge_boost',
              type: 'mid_challenge',
              productName: 'Challenge Booster Pack',
              originalPrice: 97,
              discountPercentage: 25,
              timeLimit: 48,
              customMessage: 'You are doing great! Get 25% off our Challenge Booster Pack to supercharge your progress!',
              checkoutUrl: 'https://whop.com/checkout/booster-pack'
            }
          ]
        }
      }
    });
    
    console.log(`✅ Created challenge: "${challenge.title}"`);
    console.log(`🆔 Challenge ID: ${challenge.id}`);
    
    // Create test user enrollment
    const testUser = await prisma.user.upsert({
      where: { email: 'testuser@example.com' },
      update: {},
      create: {
        email: 'testuser@example.com',
        name: 'Test User',
        role: 'USER',
        tenantId: tenant.id
      }
    });
    
    console.log(`👤 Test user: ${testUser.name} (${testUser.email})`);
    
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: testUser.id,
        challengeId: challenge.id,
        joinedAt: new Date()
      }
    });
    
    console.log(`📝 Created enrollment for testing`);
    
    // Test URLs for manual testing
    console.log('\n🔗 TEST URLs:');
    console.log(`Homepage: http://localhost:3000`);
    console.log(`Challenges: http://localhost:3000/challenges`);
    console.log(`Challenge Detail: http://localhost:3000/c/${challenge.id}`);
    console.log(`Admin (requires login): http://localhost:3000/admin`);
    console.log(`Admin Challenge Detail: http://localhost:3000/admin/c/${challenge.id}`);
    console.log(`Admin Edit Challenge: http://localhost:3000/admin/edit/${challenge.id}`);
    console.log(`Admin Winners: http://localhost:3000/admin/winners/${challenge.id}`);
    
    console.log('\n✅ Test challenge setup complete!');
    console.log('🧪 You can now test all functionality manually in the browser.');
    
  } catch (error) {
    console.error('❌ Error creating test challenge:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestChallenge();
