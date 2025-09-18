import { NextRequest, NextResponse } from 'next/server';
import { whopAppSdk } from '@/lib/whop-sdk-unified';
import { prisma } from '@/lib/prisma';

interface WhopPlan {
  id: string;
  name: string;
  title: string;
  product: string;
  initial_price: number;
  base_currency: string;
  plan_type: string;
  visibility?: string;
}

interface ActiveOffer {
  id: string;
  type: 'completion' | 'mid_challenge';
  code: string;
  discount: number;
  discountType: 'percentage' | 'flat_amount';
  planId: string;
  planName: string;
  status: 'active' | 'inactive';
  conversions: number;
  revenue: number;
  createdAt: string;
  expiresAt?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    console.log('🎯 Marketing & Monetization API called for challenge:', challengeId);

    // Get Whop headers for company identification
    const companyId = request.headers.get('x-whop-company-id');
    console.log('🏢 Company ID from headers:', companyId);

    if (!companyId) {
      console.log('❌ No company ID found in headers');
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Verify user token
    const userToken = request.headers.get('x-whop-user-token');
    if (!userToken) {
      console.log('❌ No user token found');
      return NextResponse.json({ error: 'User token required' }, { status: 401 });
    }

    console.log('🔐 Verifying user token...');
    const userVerification = await whopAppSdk.verifyUserToken(request.headers as any);
    
    if (!userVerification || !userVerification.userId) {
      console.log('❌ User token verification failed');
      return NextResponse.json({ error: 'Invalid user token' }, { status: 401 });
    }

    console.log('✅ User verified:', userVerification.userId);

    // Check company access
    console.log('🔍 Checking company access...');
    const hasAccess = await whopAppSdk.access.checkIfUserHasAccessToCompany({
      userId: userVerification.userId,
      companyId: companyId
    });

    if (!hasAccess) {
      console.log('❌ User does not have access to company');
      return NextResponse.json({ error: 'No access to company' }, { status: 403 });
    }

    console.log('✅ Company access verified');

    // Load real plans using V2 API (direct approach)
    let plans: WhopPlan[] = [];
    try {
      console.log('📦 Loading plans for company via V2 API...');
      
      // Use Company API Key for V2 plans endpoint
      const companyApiKey = process.env.WHOP_API_KEY;
      if (!companyApiKey) {
        console.log('❌ No Company API Key found');
        throw new Error('Company API Key required for plans loading');
      }

      const plansResponse = await fetch('https://api.whop.com/api/v2/plans', {
        headers: {
          'Authorization': `Bearer ${companyApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!plansResponse.ok) {
        console.log('❌ Plans API failed:', plansResponse.status, plansResponse.statusText);
        throw new Error(`Plans API failed: ${plansResponse.status}`);
      }

      const plansData = await plansResponse.json();
      console.log('📦 Plans API response:', plansData?.data?.length || 0, 'plans');
      
      if (plansData?.data) {
        plans = plansData.data.map((plan: any) => ({
          id: plan.id,
          name: plan.plan_type || plan.id,
          title: plan.plan_type || plan.id,
          product: plan.product || '',
          initial_price: plan.initial_price || 0,
          base_currency: plan.base_currency || 'USD',
          plan_type: plan.plan_type || 'unknown',
          visibility: plan.visibility
        }));
        
        console.log('📦 Processed plans:', plans.length);
        plans.forEach(plan => {
          console.log(`📦 Plan: ${plan.name} (${plan.id}) - $${plan.initial_price/100} ${plan.base_currency}`);
        });
      }
      
    } catch (error) {
      console.log('⚠️ Error loading plans, using mock data:', error);
      
      // Fallback to mock plans for development
      plans = [
        {
          id: 'plan_mock_premium_monthly',
          name: 'Premium Monthly',
          title: 'Premium Monthly', 
          product: 'prod_premium',
          initial_price: 2999,
          base_currency: 'USD',
          plan_type: 'monthly'
        },
        {
          id: 'plan_mock_premium_yearly',
          name: 'Premium Yearly',
          title: 'Premium Yearly',
          product: 'prod_premium',
          initial_price: 19999,
          base_currency: 'USD',
          plan_type: 'yearly'
        },
        {
          id: 'plan_mock_vip_monthly',
          name: 'VIP Monthly',
          title: 'VIP Monthly',
          product: 'prod_vip',
          initial_price: 9999,
          base_currency: 'USD',
          plan_type: 'monthly'
        }
      ];
    }

    // Load existing offers from database
    let offers: ActiveOffer[] = [];
    if (challengeId) {
      try {
        console.log('🎁 Loading offers for challenge:', challengeId);
        
        const challengeOffers = await prisma.challengeOffer.findMany({
          where: {
            challengeId: challengeId
          },
          include: {
            whopProduct: true // Include the WhopProduct details
          }
        });

        offers = challengeOffers.map(offer => ({
          id: offer.id,
          type: offer.offerType as 'completion' | 'mid_challenge',
          code: 'GENERATED_CODE',
          discount: offer.discountPercentage || 0,
          discountType: 'percentage' as const,
          planId: offer.whopProduct.whopProductId, // Get the actual plan ID from WhopProduct
          planName: offer.whopProduct.name || 'Unknown Plan',
          status: offer.isActive ? 'active' as const : 'inactive' as const,
          conversions: 0,
          revenue: 0,
          createdAt: offer.createdAt.toISOString(),
          expiresAt: undefined
        }));

        console.log('🎁 Offers loaded:', offers.length);
        
      } catch (error) {
        console.log('⚠️ Error loading offers:', error);
        // Continue with empty offers array
      }
    }

    const response = {
      plans,
      offers,
      summary: {
        totalPlans: plans.length,
        activeOffers: offers.filter(o => o.status === 'active').length,
        totalRevenue: offers.reduce((sum, offer) => sum + offer.revenue, 0),
        totalConversions: offers.reduce((sum, offer) => sum + offer.conversions, 0)
      }
    };

    console.log('✅ Marketing data compiled successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Marketing & Monetization API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Creating new promo code offer...');
    
    const body = await request.json();
    const { challengeId, offerType, planId, discountPercentage, promoCode, timeLimit, customMessage } = body;

    console.log('📝 Offer data:', { challengeId, offerType, planId, discountPercentage, promoCode });

    // Get Whop headers for company identification
    const companyId = request.headers.get('x-whop-company-id');
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Verify user token and company access (same as GET)
    const userToken = request.headers.get('x-whop-user-token');
    if (!userToken) {
      return NextResponse.json({ error: 'User token required' }, { status: 401 });
    }

    const userVerification = await whopAppSdk.verifyUserToken(request.headers as any);
    if (!userVerification || !userVerification.userId) {
      return NextResponse.json({ error: 'Invalid user token' }, { status: 401 });
    }

    // Validate required fields
    if (!planId || !discountPercentage || !promoCode) {
      return NextResponse.json({ 
        error: 'Plan ID, discount percentage, and promo code are required' 
      }, { status: 400 });
    }

    // Create promo code via Whop API
    console.log('🎫 Creating promo code via Whop API...');
    
    const promoData = {
      code: promoCode,
      amount_off: Number(discountPercentage),
      promo_type: 'percentage',
      plan_ids: [planId], // Use plan_id directly
      unlimited_stock: true,
      stock: 999999,
      new_users_only: false,
      base_currency: "usd"
    };

    console.log('🎫 Promo code data:', promoData);

    const promoResponse = await fetch('https://api.whop.com/v2/promo_codes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Whop-Company-ID': companyId
      },
      body: JSON.stringify(promoData)
    });

    if (!promoResponse.ok) {
      const errorText = await promoResponse.text();
      console.error('❌ Promo code creation failed:', errorText);
      return NextResponse.json({
        error: `Failed to create promo code: ${errorText}`
      }, { status: 400 });
    }

    const createdPromoCode = await promoResponse.json();
    console.log('✅ Promo code created:', createdPromoCode.code);

    // Store offer in database
    if (challengeId) {
      try {
        console.log('💾 Storing offer in database...');

        // Load plan details to get pricing information
        let planPrice = 0;
        let planName = 'Unknown Plan';
        
        try {
          const plansResponse = await fetch('https://api.whop.com/api/v2/plans', {
            headers: {
              'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });

          if (plansResponse.ok) {
            const plansData = await plansResponse.json();
            const plan = plansData?.data?.find((p: any) => p.id === planId);
            if (plan) {
              planPrice = plan.initial_price || 0;
              planName = plan.plan_type || plan.id;
            }
          }
        } catch (error) {
          console.log('⚠️ Could not load plan details for pricing:', error);
        }
        
        // Create or update WhopProduct record for the plan
        const whopProduct = await prisma.whopProduct.upsert({
          where: { whopProductId: planId },
          update: {
            name: planName,
            price: planPrice / 100, // Convert from cents to dollars
            currency: 'USD',
            isActive: true
          },
          create: {
            whopProductId: planId,
            name: planName,
            description: `Plan: ${planName}`,
            price: planPrice / 100, // Convert from cents to dollars
            currency: 'USD',
            productType: 'plan',
            checkoutUrl: `https://whop.com/checkout/${planId}`,
            isActive: true,
            creatorId: userVerification.userId,
            whopCreatorId: companyId
          }
        });

        console.log('✅ WhopProduct record ensured for plan:', whopProduct.id);

        // Calculate pricing
        const originalPrice = planPrice / 100; // Convert from cents
        const discountedPrice = originalPrice * (1 - discountPercentage / 100);
        
        const offer = await prisma.challengeOffer.create({
          data: {
            challengeId: challengeId,
            offerType: offerType,
            discountPercentage: discountPercentage,
            whopProductId: whopProduct.id, // Use database ID, not Whop plan ID
            originalPrice: originalPrice,
            discountedPrice: discountedPrice,
            isActive: true,
            timeLimit: timeLimit || null,
            customMessage: customMessage || null
          }
        });

        console.log('✅ Offer stored in database:', offer.id);

        return NextResponse.json({
          success: true,
          offer: {
            id: offer.id,
            type: offer.offerType,
            code: createdPromoCode.code,
            discount: offer.discountPercentage,
            planId: planId, // Return the actual plan ID
            status: 'active',
            createdAt: offer.createdAt.toISOString()
          },
          promoCode: createdPromoCode
        });

      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        return NextResponse.json({
          error: 'Promo code created but failed to store offer'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      promoCode: createdPromoCode
    });

  } catch (error) {
    console.error('❌ Promo code creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
