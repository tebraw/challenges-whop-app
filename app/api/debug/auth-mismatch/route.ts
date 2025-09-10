// app/api/debug/auth-mismatch/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    console.log('🔍 Debugging authentication mismatch...');
    
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 });
    }
    
    console.log('👤 Current User:', {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      whopCompanyId: user.whopCompanyId
    });
    
    // Get the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        whopSubscriptions: {
          where: { status: 'active' }
        }
      }
    });
    
    console.log('🏢 Tenant Info:', {
      id: tenant?.id,
      name: tenant?.name,
      whopCompanyId: tenant?.whopCompanyId,
      activeSubscriptions: tenant?.whopSubscriptions?.length || 0
    });
    
    // Check for company ID mismatch
    const companyIdMismatch = user.whopCompanyId !== tenant?.whopCompanyId;
    
    // Check subscription status manually
    let subscriptionCheck = null;
    if (user.whopCompanyId) {
      const tenantByCompanyId = await prisma.tenant.findFirst({
        where: { whopCompanyId: user.whopCompanyId },
        include: {
          whopSubscriptions: {
            where: {
              status: 'active',
              validUntil: { gt: new Date() }
            }
          }
        }
      });
      
      subscriptionCheck = {
        foundTenant: !!tenantByCompanyId,
        tenantId: tenantByCompanyId?.id,
        hasActiveSubscription: (tenantByCompanyId?.whopSubscriptions?.length || 0) > 0,
        subscriptions: tenantByCompanyId?.whopSubscriptions || []
      };
    }
    
    return NextResponse.json({
      success: true,
      debug: {
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
          activeSubscriptions: tenant?.whopSubscriptions || []
        },
        issues: {
          companyIdMismatch,
          userCompanyId: user.whopCompanyId,
          tenantCompanyId: tenant?.whopCompanyId
        },
        subscriptionCheck
      }
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
