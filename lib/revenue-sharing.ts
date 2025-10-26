/**
 * 💰 REVENUE SHARING SERVICE
 * 
 * Handles 90/10 revenue distribution between creators and platform
 * Uses Whop's payUser API with ledger account system
 */

import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk';

export interface RevenueDistributionRequest {
  challengeId: string;
  creatorId: string;
  whopCreatorId: string;
  paymentId: string;
  totalAmount: number; // Total payment in cents
  creatorAmount: number; // 90% amount in cents
  platformAmount: number; // 10% amount in cents
}

export interface RevenueDistributionResult {
  success: boolean;
  revenueShareId?: string;
  transferId?: string;
  error?: string;
  shouldRetry?: boolean;
}

class RevenueDistributionService {
  
  /**
   * 🎯 Main revenue distribution function
   * Called from webhook when payment succeeds
   */
  async distributeRevenue(request: RevenueDistributionRequest): Promise<RevenueDistributionResult> {
    console.log('💰 Starting revenue distribution:', {
      challengeId: request.challengeId,
      creatorId: request.creatorId,
      whopCreatorId: request.whopCreatorId,
      paymentId: request.paymentId,
      totalAmount: request.totalAmount,
      creatorAmount: request.creatorAmount,
      platformAmount: request.platformAmount,
      creatorPercentage: (request.creatorAmount / request.totalAmount * 100).toFixed(1),
      platformPercentage: (request.platformAmount / request.totalAmount * 100).toFixed(1)
    });

    try {
      // 1. Create revenue share record (pending)
      const revenueShare = await this.createRevenueShareRecord(request);
      
      // 2. Distribute revenue to creator via Whop
      const transferResult = await this.transferToCreator(request.whopCreatorId, request.creatorAmount, request);
      
      if (transferResult.success) {
        // 3. Mark as completed
        await this.markRevenueShareCompleted(revenueShare.id, transferResult.transferId!);
        
        console.log('✅ Revenue distribution completed:', {
          revenueShareId: revenueShare.id,
          transferId: transferResult.transferId,
          creatorAmount: request.creatorAmount,
          creatorAmountDollars: (request.creatorAmount / 100).toFixed(2)
        });
        
        return {
          success: true,
          revenueShareId: revenueShare.id,
          transferId: transferResult.transferId
        };
      } else {
        // 4. Mark as failed with retry option
        await this.markRevenueShareFailed(revenueShare.id, transferResult.error!, transferResult.shouldRetry || false);
        
        console.error('❌ Revenue distribution failed:', {
          revenueShareId: revenueShare.id,
          error: transferResult.error,
          shouldRetry: transferResult.shouldRetry
        });
        
        return {
          success: false,
          revenueShareId: revenueShare.id,
          error: transferResult.error,
          shouldRetry: transferResult.shouldRetry
        };
      }
      
    } catch (error) {
      console.error('💥 Revenue distribution system error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown revenue distribution error',
        shouldRetry: true
      };
    }
  }

  /**
   * 📝 Create database record for revenue tracking
   */
  private async createRevenueShareRecord(request: RevenueDistributionRequest) {
    // Type assertion to bypass TypeScript cache issue
    return await (prisma as any).revenueShare.create({
      data: {
        challengeId: request.challengeId,
        creatorId: request.creatorId,
        whopCreatorId: request.whopCreatorId,
        paymentId: request.paymentId,
        amount: request.creatorAmount,
        platformFee: request.platformAmount,
        status: 'pending',
        retryCount: 0
      }
    });
  }

  /**
   * 💸 Transfer money to creator via Whop payUser API
   */
  private async transferToCreator(whopCreatorId: string, amount: number, context: RevenueDistributionRequest) {
    try {
      console.log('🔄 Initiating Whop payUser transfer:', {
        whopCreatorId,
        amount,
        amountDollars: (amount / 100).toFixed(2),
        ledgerAccountId: process.env.WHOP_LEDGER_ACCOUNT_ID
      });

      // Validate required environment variables
      if (!process.env.WHOP_LEDGER_ACCOUNT_ID) {
        throw new Error('WHOP_LEDGER_ACCOUNT_ID environment variable not set. Run setup-ledger-account.ts first!');
      }

      // Convert cents to dollars for Whop API
      const amountInDollars = amount / 100;

      // Create idempotence key to prevent duplicate transfers
      const idempotenceKey = `revenue_${context.paymentId}_${context.challengeId}`;

      console.log('💰 Calling Whop payUser API:', {
        amount: amountInDollars,
        currency: 'usd',
        destinationId: whopCreatorId,
        ledgerAccountId: process.env.WHOP_LEDGER_ACCOUNT_ID,
        reason: 'content_reward_payout',
        idempotenceKey
      });

      // Call Whop payUser API
      const result = await whopSdk.payments.payUser({
        amount: amountInDollars,
        currency: 'usd',
        destinationId: whopCreatorId, // Creator's Whop User ID
        ledgerAccountId: process.env.WHOP_LEDGER_ACCOUNT_ID,
        reason: 'content_reward_payout', // Appropriate reason for challenge revenue
        notes: `Challenge revenue: ${context.challengeId.substring(0, 20)}`, // Max 50 chars
        idempotenceKey // Prevents duplicate transfers if webhook fires twice
      });

      if (result !== true) {
        throw new Error('payUser API returned false - transfer may have failed');
      }

      console.log('✅ Whop payUser transfer successful!', {
        whopCreatorId,
        amount: amountInDollars,
        challengeId: context.challengeId
      });

      // Note: Whop payUser returns true on success, but doesn't provide a transfer ID
      // We'll use the payment ID as reference
      return {
        success: true,
        transferId: `transfer_${context.paymentId}_${Date.now()}`
      };

    } catch (error) {
      console.error('❌ Whop payUser failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Determine if we should retry based on error type
      const shouldRetry = this.shouldRetryTransfer(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        shouldRetry
      };
    }
  }

  /**
   * ✅ Mark revenue share as completed
   */
  private async markRevenueShareCompleted(revenueShareId: string, transferId: string) {
    await (prisma as any).revenueShare.update({
      where: { id: revenueShareId },
      data: {
        status: 'completed',
        transferId: transferId,
        processedAt: new Date()
      }
    });
  }

  /**
   * ❌ Mark revenue share as failed
   */
  private async markRevenueShareFailed(revenueShareId: string, errorMessage: string, shouldRetry: boolean) {
    await (prisma as any).revenueShare.update({
      where: { id: revenueShareId },
      data: {
        status: shouldRetry ? 'retry' : 'failed',
        errorMessage: errorMessage,
        retryCount: { increment: 1 }
      }
    });
  }

  /**
   * 🔄 Determine if transfer should be retried based on error
   */
  private shouldRetryTransfer(errorMessage: string): boolean {
    const nonRetryableErrors = [
      'insufficient funds',
      'invalid user',
      'user not found',
      'invalid ledger account',
      'unauthorized'
    ];
    
    const lowerError = errorMessage.toLowerCase();
    return !nonRetryableErrors.some(err => lowerError.includes(err));
  }

  /**
   * 🔄 Retry failed revenue distributions
   */
  async retryFailedDistributions(maxRetries = 3) {
    console.log('🔄 Starting retry process for failed revenue distributions...');
    
    const failedShares = await (prisma as any).revenueShare.findMany({
      where: {
        status: 'retry',
        retryCount: { lt: maxRetries }
      },
      include: {
        challenge: true,
        creator: true
      },
      take: 10 // Limit retry batch size
    });

    console.log(`📋 Found ${failedShares.length} revenue shares to retry`);

    for (const share of failedShares) {
      if (!share.creator.whopUserId) {
        console.log(`⚠️ Skipping retry for ${share.id}: Creator has no whopUserId`);
        continue;
      }

      const retryRequest: RevenueDistributionRequest = {
        challengeId: share.challengeId,
        creatorId: share.creatorId,
        whopCreatorId: share.whopCreatorId,
        paymentId: share.paymentId,
        totalAmount: share.amount + share.platformFee,
        creatorAmount: share.amount,
        platformAmount: share.platformFee
      };

      console.log(`🔄 Retrying revenue distribution: ${share.id} (attempt ${share.retryCount + 1})`);
      
      const result = await this.distributeRevenue(retryRequest);
      
      if (result.success) {
        console.log(`✅ Retry successful for ${share.id}`);
      } else {
        console.log(`❌ Retry failed for ${share.id}: ${result.error}`);
      }
      
      // Small delay between retries
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Export singleton instance
export const revenueDistributionService = new RevenueDistributionService();

// Export helper functions
export async function distributeRevenue(request: RevenueDistributionRequest) {
  return await revenueDistributionService.distributeRevenue(request);
}

export async function retryFailedDistributions() {
  return await revenueDistributionService.retryFailedDistributions();
}
