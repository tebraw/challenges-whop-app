import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, userId, offerId, offerType, action = 'click' } = body;

    if (!challengeId || !userId || !offerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the offer interaction for analytics
    console.log(`Offer ${action}:`, {
      challengeId,
      userId,
      offerId,
      offerType,
      timestamp: new Date().toISOString()
    });

    // In a production app, you would store this in a dedicated analytics table
    // For now, we'll just return success
    
    return NextResponse.json({ 
      success: true,
      message: `Offer ${action} tracked successfully` 
    });
  } catch (error) {
    console.error('Offer tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track offer interaction' },
      { status: 500 }
    );
  }
}
