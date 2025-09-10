const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestSubscription() {
  console.log('🧪 Creating test subscription for development...');
  console.log('');

  try {
    // Find the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: 'tenant_9nmw5yleoqldrxf7n48c' }
    });

    if (!tenant) {
      console.log('❌ Tenant not found');
      return;
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`);

    // Check if subscription already exists
    const existingSubscription = await prisma.whopSubscription.findFirst({
      where: { tenantId: tenant.id }
    });

    if (existingSubscription) {
      console.log('✅ Subscription already exists - updating...');
      const updated = await prisma.whopSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          whopProductId: 'prod_YByUE3J5oT4Fq', // Basic Plan
          status: 'active',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
      console.log(`✅ Updated subscription: ${updated.id}`);
    } else {
      console.log('Creating new subscription...');
      const subscription = await prisma.whopSubscription.create({
        data: {
          tenantId: tenant.id,
          whopProductId: 'prod_YByUE3J5oT4Fq', // Basic Plan
          status: 'active',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
      console.log(`✅ Created subscription: ${subscription.id}`);
    }

    // Create initial usage record
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const existingUsage = await prisma.monthlyUsage.findFirst({
      where: {
        tenantId: tenant.id,
        month: currentMonth
      }
    });

    if (!existingUsage) {
      const usage = await prisma.monthlyUsage.create({
        data: {
          tenantId: tenant.id,
          month: currentMonth,
          challengesCreated: 3, // We just created 3 challenges
          totalParticipants: 0
        }
      });
      console.log(`✅ Created usage record for ${currentMonth}`);
    } else {
      await prisma.monthlyUsage.update({
        where: { id: existingUsage.id },
        data: {
          challengesCreated: 3
        }
      });
      console.log(`✅ Updated usage record for ${currentMonth}`);
    }

    console.log('');
    console.log('🎉 Test subscription setup complete!');
    console.log('');
    console.log('📊 Current Status:');
    console.log('- Plan: Basic (5 challenges/month, 200 participants/challenge)');
    console.log('- Status: Active');
    console.log('- Challenges Used: 3/5');
    console.log('- Valid Until: 30 days from now');
    console.log('');
    console.log('🔗 Next Steps:');
    console.log('1. Go to: http://localhost:3000/admin');
    console.log('2. Click "💎 Subscription" to view subscription details');
    console.log('3. Create new challenges (limited by subscription)');

  } catch (error) {
    console.error('❌ Error creating test subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSubscription().catch(console.error);
