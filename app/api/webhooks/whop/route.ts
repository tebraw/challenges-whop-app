import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlanByWhopProductId } from '@/lib/subscription-plans';

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    // Verify webhook signature (in production)
    // const signature = request.headers.get('whop-signature');
    // ... verify signature logic

    console.log('🔔 Whop webhook received:', event.type);

    // Handle different webhook events
    switch (event.type) {
      case 'payment_succeeded':
        console.log('💰 Payment succeeded:', event.data);
        await handlePaymentSucceeded(event.data);
        break;
      case 'membership_went_valid':
        console.log('✅ Membership valid:', event.data);
        await handleMembershipValid(event.data);
        break;
      case 'membership_went_invalid':
        console.log('❌ Membership invalid:', event.data);
        await handleMembershipInvalid(event.data);
        break;
      case 'payment_failed':
        console.log('💸 Payment failed:', event.data);
        await handlePaymentFailed(event.data);
        break;
      case 'subscription_cancelled':
        console.log('🚫 Subscription cancelled:', event.data);
        await handleSubscriptionCancelled(event.data);
        break;
      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(data: any) {
  const { user_id, product_id, company_id } = data;
  
  // Find tenant by company ID
  let tenant = await prisma.tenant.findFirst({
    where: { whopCompanyId: company_id }
  });

  if (!tenant) {
    // Create tenant if it doesn't exist
    tenant = await prisma.tenant.create({
      data: {
        name: `Company ${company_id}`,
        whopCompanyId: company_id
      }
    });
  }

  // Get plan information
  const plan = getPlanByWhopProductId(product_id);
  if (!plan) {
    console.warn('Unknown product ID:', product_id);
    return;
  }

  // Create or update subscription
  const subscription = await (prisma as any).whopSubscription.findFirst({
    where: { tenantId: tenant.id }
  });

  if (subscription) {
    // Update existing subscription
    await (prisma as any).whopSubscription.update({
      where: { id: subscription.id },
      data: {
        whopProductId: product_id,
        status: 'active',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });
  } else {
    // Create new subscription
    await (prisma as any).whopSubscription.create({
      data: {
        tenantId: tenant.id,
        whopProductId: product_id,
        status: 'active',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });
  }

  console.log(`✅ Subscription activated for tenant ${tenant.id}: ${plan.name}`);
}

async function handlePaymentFailed(data: any) {
  const { company_id } = data;
  console.log(`💸 Payment failed for company ${company_id}`);
  // Could implement retry logic or notification here
}

async function handleSubscriptionCancelled(data: any) {
  const { company_id } = data;
  
  // Find tenant by company ID
  const tenant = await prisma.tenant.findFirst({
    where: { whopCompanyId: company_id }
  });

  if (tenant) {
    // Deactivate subscription
    await (prisma as any).whopSubscription.updateMany({
      where: { 
        tenantId: tenant.id,
        status: 'active'
      },
      data: {
        status: 'cancelled'
      }
    });

    console.log(`🚫 Subscription cancelled for tenant ${tenant.id}`);
  }
}

async function handleMembershipValid(data: any) {
  await handlePaymentSucceeded(data);
}

async function handleMembershipInvalid(data: any) {
  const { company_id } = data;
  
  // Find tenant by company ID
  const tenant = await prisma.tenant.findFirst({
    where: { whopCompanyId: company_id }
  });

  if (tenant) {
    // Deactivate subscription
    await (prisma as any).whopSubscription.updateMany({
      where: { 
        tenantId: tenant.id,
        status: 'active'
      },
      data: {
        status: 'inactive'
      }
    });

    console.log(`❌ Subscription deactivated for tenant ${tenant.id}`);
  }
}
