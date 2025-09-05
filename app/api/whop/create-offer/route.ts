import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const {
      challengeId,
      productId,
      discountPercentage,
      timeLimit,
      offerType,
      customMessage
    } = await request.json();

    // For now, let's use dummy product data since we need to get this working
    // In production, you would fetch real Whop product data here
    const dummyProduct = {
      id: productId,
      name: "Premium Training Plan",
      price: 97,
      checkoutUrl: `https://whop.com/product/${productId}`
    };

    // Get the current challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Parse existing rules or create new ones
    const existingRules = challenge.rules ? 
      (challenge.rules as any) : 
      {};

    // Add monetization rules to the existing rules
    const updatedRules = {
      ...existingRules,
      monetizationRules: {
        enabled: true,
        completionOffer: {
          productName: dummyProduct.name,
          productId: dummyProduct.id,
          productUrl: dummyProduct.checkoutUrl,
          originalPrice: dummyProduct.price,
          discountPercent: discountPercentage
        }
      }
    };

    // Update the challenge with new rules
    await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        rules: updatedRules
      }
    });

    return NextResponse.json({
      success: true,
      message: "Completion offer created successfully",
      offer: updatedRules.monetizationRules.completionOffer
    });

  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    );
  }
}
