// app/api/auth/onboarding-status/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({
        isCompanyOwner: false,
        hasActiveSubscription: false,
        needsOnboarding: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Check if user is company owner (has whopCompanyId and is in Experience context)
    const isCompanyOwner = !!(currentUser.whopCompanyId && currentUser.role === 'ADMIN');

    if (!isCompanyOwner) {
      return NextResponse.json({
        isCompanyOwner: false,
        hasActiveSubscription: false,
        needsOnboarding: false,
        message: 'User is not a company owner'
      });
    }

    // Check for active subscription
    const tenant = await prisma.tenant.findFirst({
      where: { whopCompanyId: currentUser.whopCompanyId }
    });

    let hasActiveSubscription = false;
    let currentPlan = null;

    if (tenant) {
      const activeSubscription = await prisma.whopSubscription.findFirst({
        where: {
          tenantId: tenant.id,
          status: 'active',
          validUntil: {
            gt: new Date() // Must be valid in the future
          }
        }
      });

      if (activeSubscription) {
        hasActiveSubscription = true;
        // Get plan details
        const { getPlanByWhopProductId } = await import('@/lib/subscription-plans');
        currentPlan = getPlanByWhopProductId(activeSubscription.whopProductId);
      }
    }

    // Determine if onboarding is needed
    const needsOnboarding = isCompanyOwner && !hasActiveSubscription;

    return NextResponse.json({
      isCompanyOwner,
      hasActiveSubscription,
      currentPlan,
      needsOnboarding,
      user: {
        email: currentUser.email,
        name: currentUser.name,
        whopCompanyId: currentUser.whopCompanyId
      }
    });

  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json({
      isCompanyOwner: false,
      hasActiveSubscription: false,
      needsOnboarding: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
