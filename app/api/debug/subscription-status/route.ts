// app/api/debug/subscription-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getWhopSession, hasActiveSubscription } from '@/lib/whop/auth';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug: Checking subscription status...');
    
    // Get Whop session
    const session = await getWhopSession();
    
    if (!session) {
      return NextResponse.json({
        error: 'No Whop session found',
        hasSession: false,
        debug: 'User is not logged in via Whop'
      });
    }
    
    console.log('👤 User session:', {
      userId: session.userId,
      email: session.email,
      memberships: session.memberships?.length || 0
    });
    
    // Check subscription status
    const subscriptionStatus = await hasActiveSubscription(session);
    
    console.log('💰 Subscription status:', subscriptionStatus);
    
    // Debug memberships in detail
    const membershipDetails = session.memberships?.map(m => ({
      id: m.id,
      productId: m.productId,
      status: m.status,
      valid: m.valid,
      expiresAt: m.expiresAt
    })) || [];
    
    console.log('📋 Membership details:', membershipDetails);
    
    return NextResponse.json({
      hasSession: true,
      session: {
        userId: session.userId,
        email: session.email,
        companyId: session.companyId
      },
      subscriptionStatus,
      membershipDetails,
      expectedProductIds: {
        basic: 'prod_YByUE3J5oT4Fq',
        pro: 'prod_Tj4T1U7pVwtgb'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Debug subscription error:', error);
    return NextResponse.json({ 
      error: error.message,
      hasSession: false 
    });
  }
}
