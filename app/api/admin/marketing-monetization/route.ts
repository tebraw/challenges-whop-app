import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { whopCompanySdk } from '@/lib/whop-sdk-dual';

/**
 * Unified Marketing & Monetization API
 * 
 * Handles:
 * - GET: Load products + existing promo codes
 * - POST: Create new promo codes with challenge-specific logic
 * - DELETE: Remove promo codes
 * - PUT: Update promo codes
 */

export async function GET(request: NextRequest) {
  console.log('🎯 Marketing & Monetization API called - ENHANCED DEBUG');
  console.log('🔑 Environment Variables Check:');
  console.log('  - WHOP_API_KEY available:', process.env.WHOP_API_KEY ? 'YES' : 'NO');
  console.log('  - WHOP_APP_API_KEY available:', process.env.WHOP_APP_API_KEY ? 'YES' : 'NO');
  console.log('  - WHOP_API_KEY prefix:', process.env.WHOP_API_KEY ? process.env.WHOP_API_KEY.substring(0, 10) + '...' : 'NONE');
  console.log('  - WHOP_APP_API_KEY prefix:', process.env.WHOP_APP_API_KEY ? process.env.WHOP_APP_API_KEY.substring(0, 10) + '...' : 'NONE');
  
  try {
    console.log('🔍 Calling getCurrentUser()...');
    const user = await getCurrentUser();
    console.log('✅ getCurrentUser() successful:', user ? 'USER_FOUND' : 'NO_USER');
    
    if (!user || user.role !== 'ADMIN') {
      console.log('❌ Admin access denied:', { hasUser: !!user, role: user?.role });
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    console.log('✅ Admin access granted for user:', user.id);

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');
    
    if (!challengeId) {
      return NextResponse.json(
        { error: 'challengeId is required' },
        { status: 400 }
      );
    }

    // Get Company ID from headers (multi-tenant)
    const companyId = request.headers.get('X-Whop-Company-ID') || process.env.WHOP_COMPANY_ID;
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID not found' },
        { status: 400 }
      );
    }

    console.log('🎯 Loading Marketing & Monetization data for challenge:', challengeId);

    let products = [];
    let existingCodes = [];

    // Load Whop Products using Company SDK
    try {
      console.log('🔍 Using Company API to load products for company:', companyId);
      console.log('🔑 API Key available:', process.env.WHOP_API_KEY ? 'YES' : 'NO');
      console.log('🔑 API Key prefix:', process.env.WHOP_API_KEY ? process.env.WHOP_API_KEY.substring(0, 10) + '...' : 'NONE');
      
      // Try to get products via REST API with Company context
      const productsResponse = await fetch('https://api.whop.com/api/v2/products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Whop-Company-ID': companyId
        }
      });

      console.log('📊 Products API Response:', {
        status: productsResponse.status,
        statusText: productsResponse.statusText,
        headers: Object.fromEntries(productsResponse.headers.entries())
      });

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        products = productsData.data?.map((product: any) => ({
          id: product.id,
          name: product.title || product.name || 'Unnamed Product',
          title: product.title,
          visibility: product.visibility
        })) || [];
        console.log(`✅ Company API: Loaded ${products.length} products from Whop`);
      } else {
        const errorText = await productsResponse.text();
        console.log('❌ Products API Error Response:', errorText);
        throw new Error(`Products API failed: ${productsResponse.status} - ${errorText}`);
      }
      
    } catch (error) {
      console.log('⚠️ Failed to load products with Company API, using fallback:', error);
      // Fallback mock products
      products = [
        { id: 'prod_fallback_1', name: 'Premium Course', title: 'Premium Course' },
        { id: 'prod_fallback_2', name: 'VIP Access', title: 'VIP Access' },
        { id: 'prod_fallback_3', name: 'Coaching Session', title: 'Coaching Session' }
      ];
    }

    // Load existing promo codes
    try {
      const promoCodesResponse = await fetch('https://api.whop.com/api/v2/promo_codes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Whop-Company-ID': companyId
        }
      });

      if (promoCodesResponse.ok) {
        const codesData = await promoCodesResponse.json();
        // Filter codes for this challenge based on metadata
        existingCodes = codesData.data?.filter((code: any) => {
          return code.metadata?.challengeId === challengeId;
        }) || [];
        console.log(`✅ Company API: Found ${existingCodes.length} existing promo codes for challenge`);
      }
    } catch (error) {
      console.log('⚠️ Failed to load promo codes:', error);
      existingCodes = [];
    }

    // Separate completion vs mid-challenge offers
    const completionOffers = existingCodes.filter((code: any) => 
      code.metadata?.offerType === 'completion'
    );
    
    const midChallengeOffers = existingCodes.filter((code: any) => 
      code.metadata?.offerType === 'mid_challenge'
    );

    return NextResponse.json({
      success: true,
      data: {
        products,
        offers: {
          completion: completionOffers,
          midChallenge: midChallengeOffers
        },
        stats: {
          totalProducts: products.length,
          totalOffers: existingCodes.length,
          completionOffers: completionOffers.length,
          midChallengeOffers: midChallengeOffers.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Marketing & Monetization GET error:', error);
    console.error('❌ Error details:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      stack: (error as any)?.stack?.substring(0, 200) + '...'
    });
    console.log('🔍 Environment variables during error:');
    console.log('  - WHOP_API_KEY available:', process.env.WHOP_API_KEY ? 'YES' : 'NO');
    console.log('  - WHOP_APP_API_KEY available:', process.env.WHOP_APP_API_KEY ? 'YES' : 'NO');
    return NextResponse.json(
      { error: 'Failed to load marketing data', debug: (error as any)?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      challengeId,
      offerType, // 'completion' or 'mid_challenge'
      
      // Basic Promo Code Fields (Whop-style UI)
      code,
      discount_type = 'percentage',
      discount_value,
      
      // Product Selection
      productId, // Will be converted to plan_ids
      
      // Duration Settings (Whop UI fields)
      duration = 'one-time', // 'one-time', 'forever', 'multiple_months'
      number_of_intervals = 0,
      
      // User Restrictions (Whop UI fields)
      eligible_users = 'everyone', // 'everyone', 'only_new', 'only_churned'
      
      // Expiration (Whop UI fields)
      has_expiration = false,
      expiration_date = null,
      
      // Usage Limits (Whop UI fields)
      usage_limit = 100,
      one_per_customer = true,
      
      // Product Restrictions (Whop UI fields)
      apply_to_specific = true, // Always true for challenges
      
    } = body;

    // Validation
    if (!challengeId || !offerType || !discount_value || !productId) {
      return NextResponse.json({
        error: 'Missing required fields: challengeId, offerType, discount_value, productId'
      }, { status: 400 });
    }

    const companyId = request.headers.get('X-Whop-Company-ID') || process.env.WHOP_COMPANY_ID;
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID not found' },
        { status: 400 }
      );
    }

    console.log('🎯 Creating promo code:', { offerType, discount_value, productId });

    // Convert Product ID to Plan IDs
    let finalPlanIds = [];
    
    if (productId.startsWith('plan_')) {
      finalPlanIds = [productId];
      console.log('✅ Using plan ID directly:', productId);
    } else if (productId.startsWith('prod_')) {
      // Fetch product to get plan IDs
      const productResponse = await fetch(`https://api.whop.com/api/v2/products/${productId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Whop-Company-ID': companyId
        }
      });

      if (productResponse.ok) {
        const productData = await productResponse.json();
        finalPlanIds = productData.plans?.map((plan: any) => plan.id) || [];
        console.log('✅ Converted product to plan IDs:', finalPlanIds);
      } else {
        console.log('❌ Failed to fetch product plans');
        return NextResponse.json({
          error: `Failed to fetch plans for product: ${productId}`
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        error: `Invalid ID format: ${productId}. Must start with 'prod_' or 'plan_'`
      }, { status: 400 });
    }

    if (finalPlanIds.length === 0) {
      return NextResponse.json({
        error: 'No plan IDs found for the selected product'
      }, { status: 400 });
    }

    // Generate code if not provided
    const finalCode = code || `${offerType.toUpperCase()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Map Whop UI fields to API parameters
    const promoData: any = {
      code: finalCode,
      amount_off: Number(discount_value),
      promo_type: discount_type,
      plan_ids: finalPlanIds,
      base_currency: "usd",
      
      // Duration mapping
      number_of_intervals: duration === 'multiple_months' ? number_of_intervals : 0,
      
      // User restrictions mapping
      new_users_only: eligible_users === 'only_new',
      
      // Expiration mapping
      ...(has_expiration && expiration_date && {
        expiration_datetime: Math.floor(new Date(expiration_date).getTime() / 1000)
      }),
      
      // Usage limits mapping
      unlimited_stock: false, // Always use stock for challenges
      stock: usage_limit,
      
      // Challenge-specific metadata
      metadata: {
        challengeId,
        offerType,
        createdAt: Date.now(),
        onePerCustomer: one_per_customer
      }
    };

    // Challenge-specific logic
    if (offerType === 'completion') {
      // Completion offers are more restrictive
      promoData.stock = Math.min(usage_limit, 50); // Max 50 completion rewards
      console.log('🏆 Completion offer created with limited stock:', promoData.stock);
    } else if (offerType === 'mid_challenge') {
      // Mid-challenge offers are more flexible
      promoData.stock = usage_limit;
      console.log('⚡ Mid-challenge boost created with stock:', promoData.stock);
    }

    console.log('🎯 Final promo data:', promoData);

    // Create promo code via Whop API
    const response = await fetch('https://api.whop.com/api/v2/promo_codes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Whop-Company-ID': companyId
      },
      body: JSON.stringify(promoData)
    });

    if (response.ok) {
      const promoCode = await response.json();
      console.log('✅ Promo code created successfully:', promoCode.code);
      
      return NextResponse.json({
        success: true,
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          amount_off: promoCode.amount_off,
          promo_type: promoCode.promo_type,
          stock: promoCode.stock,
          offerType,
          created_at: promoCode.created_at
        }
      });
    } else {
      const errorText = await response.text();
      console.log('❌ Promo code creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json({
        error: `Failed to create promo code: ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

  } catch (error) {
    console.error('❌ Marketing & Monetization POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create promo code' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const promoCodeId = searchParams.get('promoCodeId');
    
    if (!promoCodeId) {
      return NextResponse.json(
        { error: 'promoCodeId is required' },
        { status: 400 }
      );
    }

    const companyId = request.headers.get('X-Whop-Company-ID') || process.env.WHOP_COMPANY_ID;

    // Delete promo code via Whop API
    const response = await fetch(`https://api.whop.com/api/v2/promo_codes/${promoCodeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        ...(companyId && { 'X-Whop-Company-ID': companyId })
      }
    });

    if (response.ok) {
      console.log('✅ Promo code deleted:', promoCodeId);
      return NextResponse.json({ success: true });
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to delete promo code:', errorText);
      return NextResponse.json(
        { error: 'Failed to delete promo code' },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('❌ Marketing & Monetization DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete promo code' },
      { status: 500 }
    );
  }
}