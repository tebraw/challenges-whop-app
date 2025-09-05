// app/api/whop/webhook/route.ts
import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateWebhook, whopSdk } from '@/lib/whop-sdk';

// Map your business logic here
async function handlePaymentSucceeded(data: any) {
  // TODO: update database with successful payment info
  console.log('💸 payment.succeeded', data?.id);
}

async function handlePaymentFailed(data: any) {
  console.log('💥 payment.failed', data?.id);
}

async function handleMembershipCreated(data: any) {
  console.log('🎟️ membership went valid', data?.id);
}

async function handleMembershipCancelled(data: any) {
  console.log('🪪 membership went invalid', data?.id);
}

async function handleEvent(event: string, data: any) {
  switch (event) {
    case 'payment.succeeded':
      await handlePaymentSucceeded(data);
      break;
    case 'payment.failed':
      await handlePaymentFailed(data);
      break;
    case 'membership.went_valid':
    case 'app_membership_went_valid':
      await handleMembershipCreated(data);
      break;
    case 'membership.went_invalid':
    case 'app_membership_went_invalid':
      await handleMembershipCancelled(data);
      break;
    default:
      console.log('ℹ️ Unhandled webhook event:', event);
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Update webhook validation for new Whop API
    // const { event, data } = await validateWebhook(request);
    
    console.log('🪝 Webhook received (validation disabled for deployment)');
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('❌ Webhook validation failed', err);
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }
}
