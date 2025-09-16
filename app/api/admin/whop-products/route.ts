import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCreatorProducts } from '@/lib/whopApi';
import { requireAdmin, getCurrentUser } from '@/lib/auth';
import { getExperienceContext } from "@/lib/whop-experience";

export async function GET(req: NextRequest) {
  try {
    console.log('🛍️ Whop Products API called');
    
    // Get Company ID from headers (sent by AdminGuard)
    const headersList = await import('next/headers').then(m => m.headers());
    const companyIdFromHeaders = (await headersList).get('x-whop-company-id');
    
    // Get Company ID context for admin access
    const experienceContext = await getExperienceContext();
    const companyIdFromContext = experienceContext?.companyId;
    
    const companyId = companyIdFromHeaders || companyIdFromContext;
    
    console.log('🛍️ WHOP PRODUCTS DEBUG:', {
      companyIdFromHeaders,
      companyIdFromContext,
      finalCompanyId: companyId
    });

    if (!companyId) {
      console.log('❌ No Company ID found for whop products access');
      return NextResponse.json({ error: "Company context required" }, { status: 400 });
    }

    // Verify admin access for this company
    console.log('✅ Admin access verified for whop products context:', companyId);

    // Find the tenant for this company
    let tenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: companyId }
    });

    if (!tenant) {
      console.log('❌ No tenant found for company:', companyId);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // 🔒 TENANT ISOLATION: Get challenge and verify it belongs to tenant
    const challenge = await prisma.challenge.findUnique({
      where: { 
        id: challengeId,
        tenantId: tenant.id  // 🔒 SECURITY: Only allow access to same tenant
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

    // 🎯 WHOP-NATIVE SOLUTION: Use User Token instead of Server API Key
    // Company Owner is already authenticated via Whop Dashboard and has User Token
    const userToken = (await headersList).get('x-whop-user-token');
    
    console.log('� WHOP USER TOKEN AUTH:', {
      hasUserToken: !!userToken,
      companyId: companyId,
      authentication: 'company-owner-user-token'
    });

    if (!userToken) {
      console.error('❌ No User Token - Company Owner must access via Whop Dashboard');
      return NextResponse.json(
        { error: 'User authentication required - access via Whop Dashboard' },
        { status: 401 }
      );
    }

    // 🎯 FIX: Use Company ID (already verified) for products lookup
    const creatorWhopId = companyId; // Company Owner's Company ID

    console.log('🛍️ Using Company ID for products with User Token:', creatorWhopId);

    // 🎯 DEVELOPMENT MODE: Check if we should use mock data
    const isDevelopment = process.env.NODE_ENV === 'development';
    const enableMockProducts = process.env.ENABLE_MOCK_PRODUCTS === 'true' || isDevelopment;

    try {
      // 🎯 WHOP-NATIVE: Use User Token to fetch Company Owner's own products  
      console.log(`🔐 Fetching Company Owner's products with User Token: ${creatorWhopId}`);
      
      if (creatorWhopId && userToken) {
        // 🔧 TEST MULTIPLE TOKEN FORMATS: Try different ways to use the user token
        console.log('🔧 Testing token formats for v2 API...');
        
        let whopApiResponse;
        let lastError = '';
        
        // Format 1: Bearer + token
        console.log('🔧 Trying: Bearer ${userToken}');
        whopApiResponse = await fetch(`https://api.whop.com/api/v2/me/plans?per=50&expand=product`, {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!whopApiResponse.ok) {
          lastError = await whopApiResponse.text();
          console.log('❌ Bearer format failed:', whopApiResponse.status, lastError);
          
          // Format 2: Direct token (no Bearer)
          console.log('🔧 Trying: Direct token without Bearer');
          whopApiResponse = await fetch(`https://api.whop.com/api/v2/me/plans?per=50&expand=product`, {
            headers: {
              'Authorization': userToken,
              'Content-Type': 'application/json'
            }
          });
          
          if (!whopApiResponse.ok) {
            lastError = await whopApiResponse.text();
            console.log('❌ Direct token failed:', whopApiResponse.status, lastError);
            
            // Format 3: Token as x-whop-user-token header
            console.log('🔧 Trying: x-whop-user-token header');
            whopApiResponse = await fetch(`https://api.whop.com/api/v2/me/plans?per=50&expand=product`, {
              headers: {
                'x-whop-user-token': userToken,
                'Content-Type': 'application/json'
              }
            });
          }
        }
        
        console.log('📡 Final API Response Status:', whopApiResponse.status);

        if (whopApiResponse.ok) {
          const data = await whopApiResponse.json();
          const plans = data.data || [];
          
          console.log(`✅ Fetched ${plans.length} plans from Company Owner's account`);

          if (plans.length > 0) {
            const products = plans.map((plan: any) => ({
              id: plan.id,
              name: plan.product?.title || plan.title || 'Unnamed Product',
              description: plan.product?.description || plan.description || '',
              price: plan.price || 0,
              currency: plan.currency || 'USD',
              type: 'subscription',
              imageUrl: plan.product?.image_url || null,
              checkoutUrl: `https://whop.com/checkout/${plan.id}`,
              isActive: plan.stock > 0,
              affiliateEnabled: true,
              revenueShare: 10
            }));

            return NextResponse.json({ 
              products,
              source: 'whop-user-token-api',
              message: `Found ${products.length} products from Company Owner account`,
              debug: {
                challengeId,
                creatorWhopId,
                authentication: 'user-token'
              }
            });
          }
        } else {
          const errorText = await whopApiResponse.text();
          console.error(`❌ User Token API error: ${whopApiResponse.status} - ${errorText}`);
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
          creatorWhopId,
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
        creatorWhopId,
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
