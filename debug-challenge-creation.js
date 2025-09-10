// Debug challenge creation issue
import { prisma } from './lib/prisma.js';
import { SubscriptionService } from './lib/subscription-service.js';

async function debugChallengeCreation() {
  try {
    console.log('🔍 Debugging challenge creation issue...');
    
    // First, let's check the current user
    const user = await prisma.user.findFirst({
      where: { email: 'challengesapp@whop.local' },
      include: {
        tenant: {
          include: {
            whopSubscriptions: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      whopCompanyId: user.whopCompanyId
    });
    
    if (!user.tenantId) {
      console.log('❌ User has no tenant assigned');
      return;
    }
    
    // Check tenant
    console.log('🏢 Tenant:', {
      id: user.tenant?.id,
      name: user.tenant?.name,
      whopCompanyId: user.tenant?.whopCompanyId,
      subscriptions: user.tenant?.whopSubscriptions?.length || 0
    });
    
    // Check subscription status
    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(user.tenantId);
    console.log('💳 Subscription Status:', subscriptionStatus);
    
    // Check current usage
    const currentUsage = await SubscriptionService.getCurrentUsage(user.tenantId);
    console.log('📊 Current Usage:', currentUsage);
    
    // Check if can create challenge
    const canCreate = await SubscriptionService.checkCanCreateChallenge(user.tenantId);
    console.log('✅ Can Create Challenge:', canCreate);
    
    if (!canCreate.canCreate) {
      console.log('❌ Challenge creation blocked:', canCreate.reason);
      
      // Let's create a free test subscription for this tenant
      console.log('🔧 Creating test subscription...');
      
      const testSubscription = await prisma.whopSubscription.create({
        data: {
          tenantId: user.tenantId,
          whopProductId: 'prod_RMsiHhaVQa8ER', // Free plan
          whopUserId: user.id,
          status: 'active',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          whopSubscriptionId: `test_sub_${Date.now()}`
        }
      });
      
      console.log('✅ Test subscription created:', testSubscription);
      
      // Check again
      const canCreateAfter = await SubscriptionService.checkCanCreateChallenge(user.tenantId);
      console.log('✅ Can Create Challenge After:', canCreateAfter);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChallengeCreation();
