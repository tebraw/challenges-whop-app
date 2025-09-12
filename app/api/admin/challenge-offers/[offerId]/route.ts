// app/api/admin/challenge-offers/[offerId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{
    offerId: string;
  }>;
}

// DELETE /api/admin/challenge-offers/[offerId] - Delete challenge offer
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { offerId } = await params;
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');
    const offerType = searchParams.get('offerType');

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

    // Remove the offer from the offers array
    const updatedOffers = offers.filter((offer: any) => {
      // Try to match by ID first, then by type as fallback
      if (offerId !== 'undefined' && offer.id) {
        return offer.id !== offerId;
      }
      // Fallback to type-based removal
      return offer.type !== offerType;
    });

    const updatedRules = {
      ...monetizationRules,
      offers: updatedOffers
    };

    // Update challenge with new monetization rules
    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        monetizationRules: updatedRules
      } as any
    });

    return NextResponse.json({
      message: 'Offer deleted successfully',
      challenge: updatedChallenge
    });
  } catch (error) {
    console.error('Error deleting challenge offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete challenge offer' },
      { status: 500 }
    );
  }
}
