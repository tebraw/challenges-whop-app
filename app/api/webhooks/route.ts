import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { revenueDistributionService } from "@/lib/revenue-sharing";

const validateWebhook = makeWebhookValidator({
	webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

export async function POST(request: NextRequest): Promise<Response> {
	// Validate the webhook to ensure it's from Whop
	const webhookData = await validateWebhook(request);

	// Handle the webhook event
	if (webhookData.action === "payment.succeeded") {
		const { id, final_amount, amount_after_fees, currency, user_id, metadata } =
			webhookData.data;

		console.log(
			`Payment ${id} succeeded for ${user_id} with amount ${final_amount} ${currency}`,
		);
		console.log('Payment metadata:', metadata);

		// Process enrollment creation and revenue distribution in background
		waitUntil(
			handlePaymentSuccess(
				id,
				user_id,
				final_amount,
				amount_after_fees,
				currency,
				metadata,
			),
		);
	}

	// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
	return new Response("OK", { status: 200 });
}

/**
 * Handle payment success - create enrollment and trigger revenue distribution
 */
async function handlePaymentSuccess(
	paymentId: string,
	whopUserId: string | null | undefined,
	finalAmount: number,
	amountAfterFees: number | null | undefined,
	currency: string,
	metadata: any,
) {
	try {
		console.log('🎯 Processing payment success:', {
			paymentId,
			whopUserId,
			finalAmount,
			amountAfterFees,
			metadata,
		});

		// Extract challenge and user info from metadata
		const challengeId = metadata?.challengeId;
		const experienceId = metadata?.experienceId;
		const creatorId = metadata?.creatorId;
		const whopCreatorId = metadata?.whopCreatorId;

		if (!challengeId || !experienceId) {
			console.error('❌ Missing required metadata in payment:', { metadata });
			return;
		}

		if (!whopUserId) {
			console.error('❌ No Whop user ID in payment');
			return;
		}

		// Find user in database
		const user = await prisma.user.findUnique({
			where: { whopUserId },
		});

		if (!user) {
			console.error('❌ User not found for whopUserId:', whopUserId);
			return;
		}

		// Check if enrollment already exists (prevent duplicates)
		const existingEnrollment = await prisma.enrollment.findFirst({
			where: {
				userId: user.id,
				challengeId,
			},
		});

		if (existingEnrollment) {
			console.log('✅ Enrollment already exists, skipping creation');
			return;
		}

		// Create enrollment
		const enrollment = await prisma.enrollment.create({
			data: {
				userId: user.id,
				challengeId,
				experienceId,
				joinedAt: new Date(),
			},
		});

		console.log('✅ Enrollment created:', enrollment.id);

		// Process revenue distribution if we have creator info
		if (creatorId && whopCreatorId && amountAfterFees) {
			const amountAfterFeesCents = Math.floor(amountAfterFees * 100); // Convert dollars to cents
			const creatorAmountCents = Math.floor(amountAfterFeesCents * 0.9); // 90% to creator
			const platformFeeCents = amountAfterFeesCents - creatorAmountCents; // 10% platform fee

			console.log('💰 Initiating revenue distribution:', {
				totalAmount: amountAfterFeesCents,
				creatorAmount: creatorAmountCents,
				platformFee: platformFeeCents,
				split: '90/10'
			});

			try {
				// Call revenue distribution service
				const result = await revenueDistributionService.distributeRevenue({
					challengeId,
					creatorId,
					whopCreatorId,
					paymentId,
					totalAmount: amountAfterFeesCents,
					creatorAmount: creatorAmountCents,
					platformAmount: platformFeeCents,
				});

				if (result.success) {
					console.log('✅ Revenue distribution successful!', {
						revenueShareId: result.revenueShareId,
						transferId: result.transferId,
					});
				} else {
					console.error('❌ Revenue distribution failed:', {
						error: result.error,
						shouldRetry: result.shouldRetry,
					});
					// Error is logged but enrollment is still successful
					// Revenue share will be in 'failed' status and can be retried
				}
			} catch (revenueError) {
				console.error('❌ Revenue distribution exception:', revenueError);
				// Don't fail the whole webhook if revenue distribution fails
				// Enrollment is still successful
			}
		} else {
			console.log('⚠️ Skipping revenue distribution - missing creator info or amount:', {
				hasCreatorId: !!creatorId,
				hasWhopCreatorId: !!whopCreatorId,
				hasAmountAfterFees: !!amountAfterFees,
			});
		}

	} catch (error) {
		console.error('❌ Error processing payment success:', error);
		// Don't throw - we already returned 200 OK to Whop
	}
}

async function potentiallyLongRunningHandler(
	_user_id: string | null | undefined,
	_amount: number,
	_currency: string,
	_amount_after_fees: number | null | undefined,
) {
	// This is a placeholder for a potentially long running operation
	// In a real scenario, you might need to fetch user data, update a database, etc.
}
