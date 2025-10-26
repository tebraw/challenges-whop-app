import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whopAppSdk } from '@/lib/whop-sdk-unified';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid code format' },
        { status: 400 }
      );
    }

    // Get current user from Whop headers
    const headersList = request.headers;
    const { userId: whopUserId } = await whopAppSdk.verifyUserToken(headersList as any);
    
    // Find user in our database
    const user = await prisma.user.findUnique({
      where: { whopUserId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user.id;
    const normalizedCode = code.trim().toUpperCase();

    console.log('🎟️  Promo code activation attempt:', {
      userId,
      code: normalizedCode,
      userEmail: user.email
    });

    // Find promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: normalizedCode }
    });

    if (!promoCode) {
      console.log('❌ Promo code not found:', normalizedCode);
      return NextResponse.json(
        { error: 'Invalid promo code' },
        { status: 404 }
      );
    }

    // Check if code is active
    if (!promoCode.isActive) {
      console.log('❌ Promo code deactivated:', normalizedCode);
      return NextResponse.json(
        { error: 'This promo code has been deactivated' },
        { status: 403 }
      );
    }

    // Check if code has expired
    if (promoCode.validUntil && new Date() > promoCode.validUntil) {
      console.log('❌ Promo code expired:', normalizedCode);
      return NextResponse.json(
        { error: 'This promo code has expired' },
        { status: 403 }
      );
    }

    // Check if code is already used
    if (promoCode.usedBy) {
      if (promoCode.usedBy === userId) {
        console.log('⚠️  User trying to reuse their own code:', normalizedCode);
        return NextResponse.json(
          { error: 'You have already activated this promo code' },
          { status: 409 }
        );
      } else {
        console.log('❌ Promo code already claimed by another user:', normalizedCode);
        return NextResponse.json(
          { error: 'This promo code has already been claimed' },
          { status: 409 }
        );
      }
    }

    // All checks passed - activate the code!
    const [updatedCode, updatedUser] = await prisma.$transaction([
      // Mark code as used
      prisma.promoCode.update({
        where: { code: normalizedCode },
        data: {
          usedBy: userId,
          usedAt: new Date()
        }
      }),
      // Update user with active promo code
      prisma.user.update({
        where: { id: userId },
        data: {
          activePromoCode: normalizedCode
        }
      })
    ]);

    console.log('✅ Promo code activated successfully:', {
      code: normalizedCode,
      userId,
      tier: promoCode.tier,
      userEmail: user.email
    });

    return NextResponse.json({
      success: true,
      message: `${promoCode.tier} access activated!`,
      tier: promoCode.tier,
      code: normalizedCode
    });

  } catch (error) {
    console.error('❌ Promo code activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current promo code status
export async function GET(request: NextRequest) {
  try {
    const headersList = request.headers;
    const { userId: whopUserId } = await whopAppSdk.verifyUserToken(headersList as any);
    
    const user = await prisma.user.findUnique({
      where: { whopUserId },
      select: { activePromoCode: true }
    });

    if (!user?.activePromoCode) {
      return NextResponse.json({
        hasPromoCode: false
      });
    }

    // Get promo code details
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: user.activePromoCode }
    });

    if (!promoCode) {
      return NextResponse.json({
        hasPromoCode: false
      });
    }

    return NextResponse.json({
      hasPromoCode: true,
      code: promoCode.code,
      tier: promoCode.tier,
      activatedAt: promoCode.usedAt
    });

  } catch (error) {
    console.error('❌ Promo code status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
