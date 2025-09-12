// app/api/admin/challenge-offers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createWhopOffer } from '@/lib/whopApi';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

// POST /api/admin/challenge-offers - Create challenge offer
export async function POST(request: NextRequest) {
      try {
    // SICHERHEIT: Nur Admins
    await requireAdmin();
    const user = await getCurrentUser();

    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      challengeId,
      whopProductId,
      offerType,
      discountPercentage,
      discountAmount,
      timeLimit,
      customMessage,
      triggerConditions
    } = await request.json();

    // 🔒 TENANT ISOLATION: Get product details only from same tenant
    const product = await prisma.challenge.findUnique({
      where: { 
        id: challengeId,
        tenantId: user.tenantId  // 🔒 SECURITY: Only allow access to same tenant
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Find the product (we'll need to implement this differently once DB is migrated)
    // For now, create the offer configuration
    const originalPrice = 197; // This will come from WhopProduct table
    const discountedPrice = discountPercentage 
      ? originalPrice * (1 - discountPercentage / 100)
      : originalPrice - (discountAmount || 0);

    // Create Whop offer through API
    const whopOffer = await createWhopOffer(whopProductId, {
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      expires_in_hours: timeLimit,
      custom_message: customMessage
    });

    if (!whopOffer) {
      return NextResponse.json(
        { error: 'Failed to create Whop offer' },
        { status: 500 }
      );
    }

    // Store the offer configuration in challenge monetization rules
    const existingRules = (product as any).monetizationRules || {};
    const updatedRules = {
      ...existingRules,
      offers: [
        ...(existingRules.offers || []),
        {
          id: whopOffer.id,
          type: offerType,
          productId: whopProductId,
          discountPercentage,
          discountAmount,
          originalPrice,
          discountedPrice: Math.round(discountedPrice),
          timeLimit,
          customMessage,
          triggerConditions,
          checkoutUrl: whopOffer.checkout_url,
          createdAt: new Date().toISOString()
        }
      ]
    };

    // Update challenge with monetization rules
    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        monetizationRules: updatedRules
      } as any
    });

    return NextResponse.json({
      message: 'Challenge offer created successfully',
      offer: whopOffer,
      challenge: updatedChallenge
    });
  } catch (error) {
    console.error('Error creating challenge offer:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge offer' },
      { status: 500 }
    );
  }
}

// GET /api/admin/challenge-offers - Get challenge offers
export async function GET(request: NextRequest) {
      try {
    // SICHERHEIT: Nur Admins
    await requireAdmin();
    const user = await getCurrentUser();

    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // 🔒 TENANT ISOLATION: Get challenge only from same tenant
    const challenge = await prisma.challenge.findUnique({
      where: { 
        id: challengeId,
        tenantId: user.tenantId  // 🔒 SECURITY: Only allow access to same tenant
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const monetizationRules = (challenge as any).monetizationRules || {};
    const offers = monetizationRules.offers || [];

    return NextResponse.json({
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      offers: offers
    });
  } catch (error) {
    console.error('Error fetching challenge offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge offers' },
      { status: 500 }
    );
  }
}
