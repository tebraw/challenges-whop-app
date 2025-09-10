// app/api/debug/create-test-subscription/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    console.log('🔧 Creating test subscription...');
    
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 });
    }
    
    if (!user.tenantId) {
      return NextResponse.json({ error: 'User has no tenant assigned' }, { status: 400 });
    }
    
    console.log('👤 Creating subscription for user:', user.id, 'tenant:', user.tenantId);
    
    // Create a test subscription with the Free plan
    const testSubscription = await prisma.whopSubscription.create({
      data: {
        tenantId: user.tenantId,
        whopProductId: 'prod_RMsiHhaVQa8ER', // Free plan product ID
        status: 'active',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      }
    });
    
    console.log('✅ Test subscription created:', testSubscription);
    
    return NextResponse.json({ 
      success: true,
      message: 'Test subscription created successfully',
      subscription: testSubscription
    });
    
  } catch (error) {
    console.error('❌ Error creating test subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to create test subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
