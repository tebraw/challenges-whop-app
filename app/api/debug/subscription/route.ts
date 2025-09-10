// app/api/debug/subscription/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubscriptionService } from '@/lib/subscription-service';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    console.log('🔍 Debugging subscription and challenge creation...');
    
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 });
    }
    
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      whopCompanyId: user.whopCompanyId
    });
    
    if (!user.tenantId) {
      return NextResponse.json({ error: 'User has no tenant assigned' }, { status: 400 });
    }
    
    // Check tenant with subscriptions
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        whopSubscriptions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    console.log('🏢 Tenant:', {
      id: tenant?.id,
      name: tenant?.name,
      whopCompanyId: tenant?.whopCompanyId,
      subscriptions: tenant?.whopSubscriptions?.length || 0
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
    
    const debugInfo = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        whopCompanyId: user.whopCompanyId
      },
      tenant: {
        id: tenant?.id,
        name: tenant?.name,
        whopCompanyId: tenant?.whopCompanyId,
        subscriptionsCount: tenant?.whopSubscriptions?.length || 0,
        subscriptions: tenant?.whopSubscriptions || []
      },
      subscriptionStatus,
      currentUsage,
      canCreate
    };
    
    return NextResponse.json({ 
      success: true,
      debug: debugInfo
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
