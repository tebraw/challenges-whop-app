// app/api/whop/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateWebhook, whopSdk } from '@/lib/whop-sdk';

// Map your business logic here
async function handlePaymentSucceeded(data: any) {
  try {
    console.log('💸 Payment succeeded:', data?.id);
    
    // Update user's payment status in database
    if (data?.user_id) {
      // Find the user by whopUserId and update their enrollments
      const user = await prisma.user.findUnique({
        where: { whopUserId: data.user_id }
      });
      
      if (user) {
        await prisma.enrollment.updateMany({
          where: { userId: user.id },
          data: { 
            // Add payment tracking fields if needed
            joinedAt: new Date() // Update join timestamp
          }
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
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
    
    // User got access to product - could trigger welcome flow
    if (data?.user_id && data?.product_id) {
      // Could create default challenge enrollments for new members
      console.log(`New membership for user ${data.user_id} in product ${data.product_id}`);
      
      // Find the user by whopUserId first
      const user = await prisma.user.findUnique({
        where: { whopUserId: data.user_id }
      });
      
      if (user) {
        // Example: Auto-enroll in featured challenges
        // Find challenges created by users who have this product
        const whopProduct = await prisma.whopProduct.findUnique({
          where: { whopProductId: data.product_id }
        });
        
        if (whopProduct) {
          const featuredChallenges = await prisma.challenge.findMany({
            where: { 
              creatorId: whopProduct.creatorId,
              // Add featured flag or similar
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
    // Validate webhook with new SDK
    const webhookData = await validateWebhook(request);
    
    if (!webhookData) {
      console.log('🪝 Webhook received but validation failed');
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    const { action, data } = webhookData;
    console.log(`🪝 Processing webhook event: ${action}`);
    
    // Process the webhook event
    await handleEvent(action, data);
    
    return NextResponse.json({ ok: true, event, processed: true });
  } catch (err) {
    console.error('❌ Webhook processing failed:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
