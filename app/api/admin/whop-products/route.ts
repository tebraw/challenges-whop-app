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

    console.log('Challenge found:', challenge);

    try {
      // Try to load real creator products from Whop API
      const creatorWhopId = challenge.whopCreatorId || challenge.creatorId;
      
      console.log(`Attempting to fetch Whop products for creator: ${creatorWhopId}`);
      
      if (creatorWhopId) {
        const whopProducts = await getCreatorProducts(creatorWhopId);

        console.log(`Fetched ${whopProducts.length} products from Whop API`);

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
            message: `Loaded ${products.length} products from your Whop account`,
            debug: {
              challengeId,
              creatorWhopId,
              whopApiKey: process.env.WHOP_API_KEY ? 'configured' : 'missing'
            }
          });
        }
      }
    } catch (whopError) {
      console.error('Failed to load from Whop API:', whopError);
      
      return NextResponse.json({
        products: [],
        source: 'whop_api_error',
        message: `Error loading products from Whop: ${whopError instanceof Error ? whopError.message : 'Unknown error'}`,
        debug: {
          challengeId,
          creatorWhopId: challenge.whopCreatorId || challenge.creatorId,
          whopApiKey: process.env.WHOP_API_KEY ? 'configured' : 'missing',
          error: whopError instanceof Error ? whopError.message : String(whopError)
        }
      });
    }

    // No fallback - only return real Whop products
    return NextResponse.json({
      products: [],
      source: 'whop_api_only',
      message: 'No products available. Please connect your Whop account and add products to your Whop store to enable monetization features.',
      debug: {
        challengeId,
        creatorWhopId: challenge.whopCreatorId || challenge.creatorId,
        whopApiKey: process.env.WHOP_API_KEY ? 'configured' : 'missing'
      }
    });

  } catch (error) {
    console.error('Error in whop-products API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
