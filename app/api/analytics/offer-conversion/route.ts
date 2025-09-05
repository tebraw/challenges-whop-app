import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, userId, offerId, offerType, action = 'conversion' } = body;

    if (!challengeId || !userId || !offerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the offer conversion for analytics
    console.log(`Offer ${action}:`, {
      challengeId,
      userId,
      offerId,
      offerType,
      timestamp: new Date().toISOString(),
      revenue: offerType === 'premium-75-percent' ? 67 : 47
    });

    // In a production app, you would:
    // 1. Store this in an analytics/conversion table
    // 2. Send webhook to payment processor
    // 3. Update creator revenue tracking
    // 4. Send confirmation email
    
    return NextResponse.json({ 
      success: true,
      message: `Offer ${action} tracked successfully`,
      revenue: offerType === 'premium-75-percent' ? 67 : 47
    });
  } catch (error) {
    console.error('Offer conversion tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track offer conversion' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
