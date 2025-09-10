// app/api/admin/whop-promo-codes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require admin authentication
    await requireAdmin();
    const user = await getCurrentUser();

    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      code, 
      amount_off, 
      promo_type = 'percentage', 
      product_ids = [], // Frontend sends product IDs
      unlimited_stock = true,
      new_users_only = false 
    } = body;

    // Validate required fields
    if (!code || !amount_off) {
      return NextResponse.json({
        error: 'Code and amount_off are required'
      }, { status: 400 });
    }

    // Check if we're using mock products
    const isMockProduct = product_ids.some((id: string) => id.startsWith('mock_'));
    
    if (isMockProduct) {
      // For mock products, return a mock promo code response
      console.log('🎭 Creating mock promo code for development:', {
        code,
        amount_off,
        product_ids,
        message: 'Mock promo code created - connect real Whop products for production'
      });
      
      return NextResponse.json({
        success: true,
        promoCode: {
          id: `mock_promo_${Date.now()}`,
          code: code,
          amount_off: parseInt(amount_off),
          promo_type: promo_type,
          status: 'active',
          uses: 0,
          created_at: new Date().toISOString()
        },
        message: 'Mock promo code created for development. Connect your Whop account for real promo codes.'
      });
    }

    // Check if Whop API credentials are available for real products
    if (!process.env.WHOP_API_KEY) {
      return NextResponse.json({
        error: 'Whop API credentials not configured'
      }, { status: 500 });
    }

    // 🔧 CONVERT PRODUCT IDS TO PLAN IDS
    // We need to get the plan IDs for the selected products
    const { getCompanyProducts } = await import('@/lib/whopApi');
    
    try {
      // Get all products with their plan IDs
      const allProducts = await getCompanyProducts();
      const planIds: string[] = [];
      
      for (const productId of product_ids) {
        const product = allProducts.find(p => p.id === productId);
        if (product && product.plan_id) {
          planIds.push(product.plan_id);
          console.log(`✅ Mapped product ${productId} to plan ${product.plan_id}`);
        } else {
          console.log(`⚠️ No plan found for product ${productId}`);
        }
      }
      
      if (planIds.length === 0) {
        return NextResponse.json({
          error: 'No valid plan IDs found for the selected products'
        }, { status: 400 });
      }

      console.log(`🎯 Using plan IDs for promo code: ${planIds.join(', ')}`);

      // Calculate expiration date: 7 days from now
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      const calculatedExpiration = expirationDate.toISOString();

      // Create promo code via Whop API v2 with plan IDs
      const promoData = {
        code,
        amount_off: parseInt(amount_off),
        promo_type,
        plan_ids: planIds, // Use plan IDs instead of product IDs
        unlimited_stock,
        new_users_only,
        expiration_datetime: calculatedExpiration
      };

      console.log('🔄 Creating Whop promo code:', {
        code,
        amount_off,
        plan_ids: planIds, // Use the correct variable name
        expiration_datetime: calculatedExpiration
      });

      const response = await fetch('https://api.whop.com/api/v2/promo_codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(promoData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Whop API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestData: promoData
        });
        throw new Error(`Whop API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const promoCode = await response.json();
      
      return NextResponse.json({
        success: true,
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          amount_off: promoCode.amount_off,
          promo_type: promoCode.promo_type,
          status: promoCode.status,
          uses: promoCode.uses || 0,
          created_at: promoCode.created_at
        }
      });

    } catch (error) {
      console.error('❌ Error during plan ID conversion or promo code creation:', error);
      return NextResponse.json({
        error: 'Failed to create promo code',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error creating Whop promo code:', error);
    console.error('❌ Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      whopApiKey: process.env.WHOP_API_KEY ? 'Present' : 'Missing'
    });
    return NextResponse.json({
      error: 'Failed to create promo code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require admin authentication
    await requireAdmin();

    // Check if Whop API credentials are available
    if (!process.env.WHOP_API_KEY) {
      return NextResponse.json({
        error: 'Whop API credentials not configured'
      }, { status: 500 });
    }

    // Fetch existing promo codes from Whop API v2
    const response = await fetch('https://api.whop.com/api/v2/promo_codes?status=active', {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Whop API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      promoCodes: data.data?.map((promo: any) => ({
        id: promo.id,
        code: promo.code,
        amount_off: promo.amount_off,
        promo_type: promo.promo_type,
        status: promo.status,
        uses: promo.uses || 0,
        created_at: promo.created_at,
        expiration_datetime: promo.expiration_datetime
      })) || []
    });

  } catch (error) {
    console.error('Error fetching Whop promo codes:', error);
    return NextResponse.json({
      error: 'Failed to fetch promo codes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
