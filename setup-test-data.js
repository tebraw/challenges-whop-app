#!/usr/bin/env node

/**
 * SETUP TEST DATA
 * Creates tenant, user and test subscription for development
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('🧪 Setting up test data for subscription system...\n');

    // Create tenant
    const tenant = await prisma.tenant.upsert({
      where: { id: 'tenant_9nmw5yleoqldrxf7n48c' },
      update: {},
      create: {
        id: 'tenant_9nmw5yleoqldrxf7n48c',
        name: 'Company 9nmw5y',
        whopCompanyId: '9nmw5yleoqldrxf7n48c'
      }
    });

    console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { id: 'cmf9u7fzd000251fk7l4cb5ji' },
      update: {},
      create: {
        id: 'cmf9u7fzd000251fk7l4cb5ji',
        email: 'challengesapp@whop.local',
        name: 'Challenges Admin',
        role: 'ADMIN',
        tenantId: tenant.id,
        whopUserId: 'user_whop123',
        whopCompanyId: '9nmw5yleoqldrxf7n48c'
      }
    });

    console.log(`✅ Admin user created: ${adminUser.email}`);

    // Create test subscription (Basic Plan)
    const subscription = await prisma.whopSubscription.upsert({
      where: {
        id: 'test-subscription-basic'
      },
      update: {
        tenantId: tenant.id,
        whopProductId: 'prod_YByUE3J5oT4Fq', // Basic Plan
        status: 'active',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      create: {
        id: 'test-subscription-basic',
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

    // Create monthly usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const monthlyUsage = await prisma.monthlyUsage.upsert({
      where: {
        tenantId_month: {
          tenantId: tenant.id,
          month: currentMonth
        }
      },
      update: {
        challengesCreated: 2 // Show some usage for testing
      },
      create: {
        tenantId: tenant.id,
        month: currentMonth,
        challengesCreated: 2 // Show some usage for testing
      }
    });

    console.log(`✅ Monthly usage record created for ${currentMonth}`);
    console.log(`   - Challenges used: ${monthlyUsage.challengesCreated}/5 (Basic Plan limit)`);

    console.log('\n🎯 Test Setup Complete!');
    console.log('You can now test:');
    console.log('  - Visit http://localhost:3000/subscription to see your plan');
    console.log('  - Visit http://localhost:3000/admin to see the admin dashboard');
    console.log('  - Check /api/subscription/status for current status');
    console.log('  - Try creating challenges to test limits');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
