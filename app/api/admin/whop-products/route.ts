import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCreatorProducts } from '@/lib/whopApi';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Require admin authentication
    await requireAdmin();
    
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // Get challenge to identify the creator
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { 
        creatorId: true,
        whopCreatorId: true
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    try {
      // Try to load real creator products from Whop API
      const creatorWhopId = challenge.whopCreatorId || challenge.creatorId;
      
      if (creatorWhopId) {
        const whopProducts = await getCreatorProducts(creatorWhopId);

        if (whopProducts && whopProducts.length > 0) {
          const products = whopProducts.map((product) => ({
            id: product.id,
            name: product.title,
            description: product.description,
            price: product.price,
            currency: product.currency || 'USD',
            type: product.product_type || 'digital',
            imageUrl: product.image_url,
            checkoutUrl: product.checkout_url || `https://whop.com/checkout/${product.id}`,
            isActive: product.is_active
          }));

          return NextResponse.json({
            products,
            source: 'whop_api',
            message: `Loaded ${products.length} products from your Whop account`
          });
        }
      }
    } catch (whopError) {
      console.warn('Failed to load from Whop API:', whopError);
    }

    // No fallback - only return real Whop products
    return NextResponse.json({
      products: [],
      source: 'whop_api_only',
      message: 'No products available. Please connect your Whop account and add products to your Whop store to enable monetization features.'
    });

  } catch (error) {
    console.error('Error in whop-products API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
