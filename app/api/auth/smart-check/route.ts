// app/api/auth/smart-check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getWhopSession, hasActiveSubscription } from '@/lib/whop/auth';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    console.log('🧠 Smart access check started...');
    
    // Get current user context
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        needsAuth: true,
        action: 'login'
      });
    }
    
    console.log('👤 User found:', user.email);
    console.log('🎭 Current role:', user.role);
    console.log('🏢 Company ID:', user.whopCompanyId);
    
    // Check for fallback company ID problem
    if (user.whopCompanyId === '9nmw5yleoqldrxf7n48c') {
      console.log('🚨 FALLBACK COMPANY ID detected - user needs re-authentication');
      return NextResponse.json({
        hasAccess: false,
        userRole: 'invalid',
        hasFallbackCompanyId: true,
        action: 'reauth',
        message: 'Invalid company ID - please re-authenticate via Whop app',
        debug: 'Fallback company ID detected - authentication needs refresh'
      });
    }
    
    // If user is already admin, they're good to go
    if (user.role === 'ADMIN') {
      console.log('✅ User is already admin');
      return NextResponse.json({
        hasAccess: true,
        userRole: 'admin',
        message: 'Admin access granted'
      });
    }
    
    // If user has company ID but is not admin, check subscription
    if (user.whopCompanyId && user.role === 'USER') {
      console.log('🔍 Company owner without admin role - checking subscription...');
      
      // Get Whop session to check subscription
      const whopSession = await getWhopSession();
      if (!whopSession) {
        console.log('❌ No Whop session found');
        return NextResponse.json({
          hasAccess: false,
          userRole: 'user',
          needsAuth: true,
          action: 'login',
          message: 'Whop authentication required'
        });
      }
      
      // Check subscription status
      const subscriptionStatus = await hasActiveSubscription(whopSession);
      console.log('🎯 Subscription check result:', subscriptionStatus);
      
      if (subscriptionStatus.hasSubscription) {
        console.log('🎉 User has valid subscription - upgrading to admin');
        
        // Upgrade user to admin
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'ADMIN',
            subscriptionStatus: 'active',
            tier: 'enterprise',
            isFreeTier: false
          }
        });
        
        console.log('✅ User upgraded to admin successfully');
        return NextResponse.json({
          hasAccess: true,
          userRole: 'admin',
          message: 'Subscription verified - admin access granted',
          upgraded: true
        });
      } else {
        console.log('❌ No valid subscription found');
        return NextResponse.json({
          hasAccess: false,
          userRole: 'user',
          isCompanyOwner: true,
          needsSubscription: true,
          action: 'subscribe',
          message: 'Company owner needs Access Pass subscription'
        });
      }
    }
    
    // Regular user without company ownership
    console.log('👤 Regular user without company ownership');
    return NextResponse.json({
      hasAccess: false,
      userRole: 'user',
      isCompanyOwner: false,
      action: 'install_app',
      message: 'Install the app to get company ownership'
    });
    
  } catch (error) {
    console.error('❌ Smart check error:', error);
    return NextResponse.json({
      error: 'Check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}