#!/usr/bin/env node

/**
 * CREATE TEST SUBSCRIPTION
 * Creates a test subscription for development testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestSubscription() {
  try {
    console.log('🧪 Creating test subscription for development...\n');

    // Find the current tenant
    const tenant = await prisma.tenant.findFirst({
      include: {
        users: true
      }
    });

    if (!tenant) {
      console.log('❌ No tenant found. Please ensure a tenant exists first.');
      return;
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`);

    // Create test subscription (Basic Plan)
    const subscription = await prisma.whopSubscription.upsert({
      where: {
        tenantId: tenant.id
      },
      update: {
        whopProductId: 'prod_YByUE3J5oT4Fq', // Basic Plan
        status: 'active',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      create: {
        tenantId: tenant.id,
        whopProductId: 'prod_YByUE3J5oT4Fq', // Basic Plan
        status: 'active',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    console.log('✅ Test subscription created:');
    console.log(`   - Product ID: ${subscription.whopProductId} (Basic Plan)`);
    console.log(`   - Status: ${subscription.status}`);
    console.log(`   - Valid until: ${subscription.validUntil}`);

    // Create or reset monthly usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const monthlyUsage = await prisma.monthlyUsage.upsert({
      where: {
        tenantId_month: {
          tenantId: tenant.id,
          month: currentMonth
        }
      },
      update: {
        challengesCreated: 0 // Reset for testing
      },
      create: {
        tenantId: tenant.id,
        month: currentMonth,
        challengesCreated: 0
      }
    });

    console.log(`✅ Monthly usage record created for ${currentMonth}`);
    console.log(`   - Challenges used: ${monthlyUsage.challengesCreated}/5 (Basic Plan limit)`);

    console.log('\n🎯 Test Setup Complete!');
    console.log('You can now test:');
    console.log('  - Visit http://localhost:3000/subscription to see your plan');
    console.log('  - Try creating challenges to test limits');
    console.log('  - Check /api/subscription/status for current status');

  } catch (error) {
    console.error('❌ Error creating test subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSubscription();
