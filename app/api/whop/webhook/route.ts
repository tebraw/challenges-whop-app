// app/api/whop/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateWebhook, whopSdk } from '@/lib/whop-sdk';

// Import revenue sharing service
import { distributeRevenue } from '@/lib/revenue-sharing';

// Enhanced payment processing with revenue sharing
async function handlePaymentSucceeded(data: any) {
  try {
    console.error('💰 WEBHOOK: Payment succeeded - FULL DATA:', JSON.stringify(data, null, 2));
    console.error('💰 WEBHOOK: Payment ID:', data?.id);
    console.error('💰 WEBHOOK: User ID:', data?.user_id);
    console.error('💰 WEBHOOK: Amount:', data?.amount);
    console.error('💰 WEBHOOK: Metadata:', JSON.stringify(data?.metadata, null, 2));
    
    const metadata = data?.metadata;
    
    // Check if this is a challenge payment that requires revenue sharing
    if (metadata?.type === 'challenge_entry' && metadata?.challengeId && metadata?.whopCreatorId) {
      console.error('🎯 WEBHOOK: Challenge payment detected - processing enrollment and revenue share');
      console.error('🎯 WEBHOOK: Challenge ID:', metadata.challengeId);
      console.error('🎯 WEBHOOK: Whop Creator ID:', metadata.whopCreatorId);
      console.error('🎯 WEBHOOK: Creator Amount:', metadata.creatorAmount);
      console.error('🎯 WEBHOOK: Platform Amount:', metadata.platformAmount);
      console.error('🎯 WEBHOOK: Total Amount:', metadata.totalAmount);
      
      // 1. Create challenge enrollment
      await createChallengeEnrollment(data.user_id, metadata);
      
      // 2. Distribute revenue to creator (if creator info available)
      if (metadata.whopCreatorId && metadata.creatorAmount) {
        console.error('✅ WEBHOOK: Creator info available - triggering revenue distribution');
        await distributeRevenueToCreator(data, metadata);
      } else {
        console.error('⚠️ WEBHOOK: Skipping revenue distribution - Missing creator info:', {
          hasWhopCreatorId: !!metadata.whopCreatorId,
          hasCreatorAmount: !!metadata.creatorAmount,
          whopCreatorId: metadata.whopCreatorId,
          creatorAmount: metadata.creatorAmount
        });
      }
      
    } else {
      console.error('ℹ️ WEBHOOK: Non-challenge payment or missing metadata:', {
        hasType: !!metadata?.type,
        type: metadata?.type,
        hasChallengeId: !!metadata?.challengeId,
        hasWhopCreatorId: !!metadata?.whopCreatorId,
        usingLegacyHandling: true
      });
      
      // Legacy handling for other payment types
      if (data?.user_id) {
        const user = await prisma.user.findUnique({
          where: { whopUserId: data.user_id }
        });
        
        if (user) {
          await prisma.enrollment.updateMany({
            where: { userId: user.id },
            data: { 
              joinedAt: new Date()
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('💥 WEBHOOK ERROR: Error handling payment succeeded:', error);
  }
}

// Create challenge enrollment for paid user
async function createChallengeEnrollment(whopUserId: string, metadata: any) {
  try {
    console.log('🎫 Creating challenge enrollment:', {
      whopUserId,
      challengeId: metadata.challengeId,
      experienceId: metadata.experienceId
    });

    // Find user by whopUserId
    const user = await prisma.user.findUnique({
      where: { whopUserId: whopUserId }
    });

    if (!user) {
      console.error('❌ User not found for enrollment:', whopUserId);
      return;
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        challengeId: metadata.challengeId,
        experienceId: metadata.experienceId,
        joinedAt: new Date()
      }
    });

    console.log('✅ Challenge enrollment created:', {
      enrollmentId: enrollment.id,
      userId: user.id,
      challengeId: metadata.challengeId
    });

  } catch (error) {
    console.error('❌ Failed to create challenge enrollment:', error);
  }
}

// Distribute revenue to challenge creator
async function distributeRevenueToCreator(paymentData: any, metadata: any) {
  try {
    console.error('💸 REVENUE DIST: Initiating revenue distribution');
    console.error('💸 REVENUE DIST: Payment ID:', paymentData.id);
    console.error('💸 REVENUE DIST: Challenge ID:', metadata.challengeId);
    console.error('💸 REVENUE DIST: Whop Creator ID:', metadata.whopCreatorId);
    console.error('💸 REVENUE DIST: Total Amount:', metadata.totalAmount);
    console.error('💸 REVENUE DIST: Creator Amount (90%):', metadata.creatorAmount);
    console.error('💸 REVENUE DIST: Platform Amount (10%):', metadata.platformAmount);

    const result = await distributeRevenue({
      challengeId: metadata.challengeId,
      creatorId: metadata.creatorId,
      whopCreatorId: metadata.whopCreatorId,
      paymentId: paymentData.id,
      totalAmount: parseInt(metadata.totalAmount),
      creatorAmount: parseInt(metadata.creatorAmount),
      platformAmount: parseInt(metadata.platformAmount)
    });

    if (result.success) {
      console.error('✅ REVENUE DIST: Revenue distribution completed successfully!');
      console.error('✅ REVENUE DIST: Revenue Share ID:', result.revenueShareId);
      console.error('✅ REVENUE DIST: Transfer ID:', result.transferId);
    } else {
      console.error('❌ REVENUE DIST: Revenue distribution FAILED!');
      console.error('❌ REVENUE DIST: Error:', result.error);
      console.error('❌ REVENUE DIST: Should Retry?:', result.shouldRetry);
    }

  } catch (error) {
    console.error('💥 REVENUE DIST ERROR: Revenue distribution system error:', error);
    console.error('💥 REVENUE DIST ERROR: Stack:', error instanceof Error ? error.stack : 'No stack trace');
  }
}

async function handlePaymentFailed(data: any) {
  try {
    console.log('💥 Payment failed:', data?.id);
    
    // Handle failed payment - maybe send notification or update status
    if (data?.user_id) {
      // Could implement payment retry logic or user notification
      console.log(`Payment failed for user: ${data.user_id}`);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleMembershipCreated(data: any) {
  try {
    console.log('🎟️ Membership created:', data?.id);
    
    // User got access to product - upgrade to admin if they have company
    if (data?.user_id && data?.product_id) {
      console.log(`New membership for user ${data.user_id} in product ${data.product_id}`);
      
      // Find the user by whopUserId
      const user = await prisma.user.findUnique({
        where: { whopUserId: data.user_id }
      });
      
      if (user) {
        console.log(`👤 Found user: ${user.email}, current role: ${user.role}`);
        
        // Check if this is our Basic or Pro plan
        const basicProductId = 'prod_YByUE3J5oT4Fq';
        const proProductId = 'prod_Tj4T1U7pVwtgb';
        
        if (data.product_id === basicProductId || data.product_id === proProductId) {
          console.log(`💰 User purchased admin plan (${data.product_id === proProductId ? 'Pro' : 'Basic'})`);
          
          // Upgrade user to admin if they have company ID (company owner)
          if (user.whopCompanyId && user.role !== 'ADMIN') {
            await prisma.user.update({
              where: { id: user.id },
              data: { 
                role: 'ADMIN',
                subscriptionStatus: data.product_id === proProductId ? 'pro' : 'basic',
                isFreeTier: false
              }
            });
            
            console.log(`🚀 UPGRADED USER TO ADMIN: ${user.email} (${data.product_id === proProductId ? 'Pro' : 'Basic'} plan)`);
          } else if (!user.whopCompanyId) {
            console.log(`⚠️ User ${user.email} purchased but has no company ID - not upgrading to admin`);
          } else {
            console.log(`✅ User ${user.email} already has admin role`);
          }
        }
        
        // Auto-enroll in featured challenges (existing logic)
        const whopProduct = await prisma.whopProduct.findUnique({
          where: { whopProductId: data.product_id }
        });
        
        if (whopProduct) {
          const featuredChallenges = await prisma.challenge.findMany({
            where: { 
              creatorId: whopProduct.creatorId,
            },
            select: {
              id: true,
              experienceId: true
            },
            take: 3
          });
          
          for (const challenge of featuredChallenges) {
            await prisma.enrollment.upsert({
              where: {
                challengeId_userId: {
                  challengeId: challenge.id,
                  userId: user.id
                }
              },
              create: {
                challengeId: challenge.id,
                userId: user.id,
                experienceId: challenge.experienceId,
                joinedAt: new Date()
              },
              update: {}
            });
          }
        }
      } else {
        console.log(`⚠️ No user found for whopUserId: ${data.user_id}`);
      }
    }
  } catch (error) {
    console.error('Error handling membership created:', error);
  }
}

async function handleMembershipCancelled(data: any) {
  try {
    console.log('🪪 Membership cancelled:', data?.id);
    
    // User lost access - could pause active enrollments
    if (data?.user_id && data?.product_id) {
      // Find the user by whopUserId first
      const user = await prisma.user.findUnique({
        where: { whopUserId: data.user_id }
      });
      
      if (user) {
        // Mark enrollments as inactive for challenges from this product's creator
        const whopProduct = await prisma.whopProduct.findUnique({
          where: { whopProductId: data.product_id }
        });
        
        if (whopProduct) {
          await prisma.enrollment.updateMany({
            where: { 
              userId: user.id,
              challenge: {
                creatorId: whopProduct.creatorId
              }
            },
            data: {
              // Could add status field to track this
              joinedAt: new Date()
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error handling membership cancelled:', error);
  }
}

async function handleUserCreated(data: any) {
  try {
    console.log('👤 User created:', data?.id);
    
    // New user signed up - could create welcome challenges or send onboarding
    if (data?.id) {
      console.log(`Welcome new user: ${data.id}`);
      // Could implement user onboarding flow
    }
  } catch (error) {
    console.error('Error handling user created:', error);
  }
}

async function handleEvent(event: string, data: any) {
  switch (event) {
    case 'payment.succeeded':
      await handlePaymentSucceeded(data);
      break;
    case 'payment.failed':
      await handlePaymentFailed(data);
      break;
      break;
    case 'membership.went_valid':
    case 'app_membership_went_valid':
      await handleMembershipCreated(data);
      break;
    case 'membership.went_invalid':
    case 'app_membership_went_invalid':
      await handleMembershipCancelled(data);
      break;
    case 'user.created':
      await handleUserCreated(data);
      break;
    default:
      console.log('ℹ️ Unhandled webhook event:', event);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🪝 WEBHOOK RECEIVED - Starting validation...');
    
    // Validate webhook with new SDK
    const webhookData = await validateWebhook(request);
    
    if (!webhookData) {
      console.log('🚨 Webhook validation FAILED - Invalid signature or payload');
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    const { action, data } = webhookData;
    console.log(`🎯 WEBHOOK EVENT VALIDATED: ${action}`, {
      action,
      dataKeys: Object.keys(data || {}),
      hasMetadata: !!(data as any)?.metadata,
      timestamp: new Date().toISOString()
    });
    
    // Extra logging for payment events
    if (action === 'payment.succeeded') {
      console.log('💰 PAYMENT SUCCESS WEBHOOK DETAILS:', {
        paymentId: data?.id,
        userId: (data as any)?.user_id,
        amount: (data as any)?.amount,
        metadata: (data as any)?.metadata,
        hasRequiredFields: !!(data?.id && (data as any)?.user_id && (data as any)?.metadata)
      });
    }
    
    // Process the webhook event
    await handleEvent(action, data);
    
    console.log(`✅ WEBHOOK PROCESSED SUCCESSFULLY: ${action}`);
    return NextResponse.json({ 
      ok: true, 
      event: action, 
      processed: true,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('💥 WEBHOOK PROCESSING FAILED:', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
