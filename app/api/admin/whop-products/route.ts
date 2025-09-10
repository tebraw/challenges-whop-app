import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCreatorProducts } from '@/lib/whopApi';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Require admin authentication and get user context
    await requireAdmin();
    const user = await getCurrentUser();
    
    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // 🔒 TENANT ISOLATION: Get challenge and verify it belongs to user's tenant
    const challenge = await prisma.challenge.findUnique({
      where: { 
        id: challengeId,
        tenantId: user.tenantId  // 🔒 SECURITY: Only allow access to same tenant
      },
      select: { 
        creatorId: true,
        whopCreatorId: true,
        tenantId: true
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found or access denied' },
        { status: 404 }
      );
    }

    console.log('Challenge found:', challenge);

    // Get creator Whop ID for later use
    const creatorWhopId = challenge.whopCreatorId || challenge.creatorId;

    // 🎯 DEVELOPMENT MODE: Check if we should use mock data
    const isDevelopment = process.env.NODE_ENV === 'development';
    const enableMockProducts = process.env.ENABLE_MOCK_PRODUCTS === 'true' || false; // Real products now working with v5 API!

    try {
      // 🚀 NEW SCOPES ENABLED: Try to load real creator products from Whop API
      console.log(`✅ New Whop API scopes enabled! Fetching products for creator: ${creatorWhopId}`);
      
      if (creatorWhopId) {
        const whopProducts = await getCreatorProducts(creatorWhopId);

        console.log(`🎯 Successfully fetched ${whopProducts.length} products from Whop API with new scopes!`);

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
            isActive: product.is_active,
            affiliateEnabled: true, // 💰 Ready for affiliate features with new scope
            revenueShare: 10, // 💰 10% revenue share for app
            canCreateDynamicOffers: true, // 🆕 plan:create scope enabled
            hasStats: true, // 🆕 plan:stats:read scope enabled
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
      
      // 🔧 FALLBACK: Use mock products in development if API fails
      if (enableMockProducts) {
        const mockProducts = [
          {
            id: 'mock_premium_course',
            name: '💎 Premium Fitness Course',
            description: 'Complete fitness transformation program with personalized coaching and nutrition plans. Perfect for challenge winners!',
            price: 9900, // $99.00 in cents
            currency: 'USD',
            type: 'course',
            imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
            checkoutUrl: `https://whop.com/checkout/mock_premium_course?ref=${challengeId}`,
            isActive: true,
            affiliateEnabled: true,
            revenueShare: 15, // 15% for premium products
          },
          {
            id: 'mock_supplement_bundle',
            name: '🥤 Elite Supplement Bundle',
            description: 'Professional-grade supplements bundle. Pre-workout, protein, and recovery supplements for serious athletes.',
            price: 14900, // $149.00
            currency: 'USD',
            type: 'physical',
            imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
            checkoutUrl: `https://whop.com/checkout/mock_supplement_bundle?ref=${challengeId}`,
            isActive: true,
            affiliateEnabled: true,
            revenueShare: 12,
          },
          {
            id: 'mock_coaching_session',
            name: '🎯 1-on-1 Coaching Session',
            description: 'Personal coaching session with certified trainer. Goal setting, technique review, and personalized workout plan.',
            price: 7900, // $79.00
            currency: 'USD',
            type: 'service',
            imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
            checkoutUrl: `https://whop.com/checkout/mock_coaching_session?ref=${challengeId}`,
            isActive: true,
            affiliateEnabled: true,
            revenueShare: 20, // Higher share for services
          },
          {
            id: 'mock_nutrition_plan',
            name: '🥗 Custom Nutrition Plan',
            description: 'Personalized meal plans based on your goals, dietary preferences, and lifestyle. 30-day program included.',
            price: 4900, // $49.00
            currency: 'USD',
            type: 'digital',
            imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
            checkoutUrl: `https://whop.com/checkout/mock_nutrition_plan?ref=${challengeId}`,
            isActive: true,
            affiliateEnabled: true,
            revenueShare: 10,
          }
        ];

        return NextResponse.json({
          products: mockProducts,
          source: 'mock_development',
          message: `Development mode: Using ${mockProducts.length} mock products. Configure Whop API scopes for production.`,
          debug: {
            challengeId,
            creatorWhopId,
            whopApiKey: process.env.WHOP_API_KEY ? 'configured' : 'missing',
            error: whopError instanceof Error ? whopError.message : String(whopError),
            requiredScopes: [
              'plan:create', 'plan:delete', 'plan:stats:read', 'plan:update', 
              'affiliate:create', 'affiliate:update', 'payment:basic:read',
              'member:basic:read', 'stats:read'
            ]
          }
        });
      }
      
      return NextResponse.json({
        products: [],
        source: 'whop_api_error',
        message: `Error loading products from Whop: ${whopError instanceof Error ? whopError.message : 'Unknown error'}. Please configure API scopes.`,
        debug: {
          challengeId,
          creatorWhopId: challenge.whopCreatorId || challenge.creatorId,
          whopApiKey: process.env.WHOP_API_KEY ? 'configured' : 'missing',
          error: whopError instanceof Error ? whopError.message : String(whopError),
          requiredScopes: [
            'plan:create', 'plan:delete', 'plan:stats:read', 'plan:update', 
            'affiliate:create', 'affiliate:update', 'payment:basic:read',
            'member:basic:read', 'stats:read'
          ]
        }
      });
    }

    // 🔧 FALLBACK: Use mock products if enabled
    if (enableMockProducts) {
      const mockProducts = [
        {
          id: 'mock_starter_guide',
          name: '📚 Challenge Starter Guide',
          description: 'Essential guide to get started with fitness challenges. Tips, tricks, and motivation to succeed.',
          price: 1900, // $19.00
          currency: 'USD',
          type: 'digital',
          imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
          checkoutUrl: `https://whop.com/checkout/mock_starter_guide?ref=${challengeId}`,
          isActive: true,
          affiliateEnabled: true,
          revenueShare: 8,
        }
      ];

      return NextResponse.json({
        products: mockProducts,
        source: 'mock_fallback',
        message: 'Using mock products for development. Connect your Whop account for real products.',
        debug: {
          challengeId,
          creatorWhopId: challenge.whopCreatorId || challenge.creatorId,
          whopApiKey: process.env.WHOP_API_KEY ? 'configured' : 'missing'
        }
      });
    }

    // Production mode without working API
    return NextResponse.json({
      products: [],
      source: 'production_no_api',
      message: 'No products available. Please configure Whop API scopes: plan:create, plan:stats:read, affiliate:create, payment:basic:read',
      debug: {
        challengeId,
        creatorWhopId: challenge.whopCreatorId || challenge.creatorId,
        whopApiKey: process.env.WHOP_API_KEY ? 'configured' : 'missing',
        requiredScopes: [
          'plan:create', 'plan:delete', 'plan:stats:read', 'plan:update', 
          'affiliate:create', 'affiliate:update', 'payment:basic:read',
          'member:basic:read', 'stats:read'
        ]
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
