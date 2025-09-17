// app/api/admin/whop-promo-codes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopCompanySdk, createCompanyWhopSdk } from '@/lib/whop-sdk';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Company Owner authentication (same as whop-products API)
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    const companyId = headersList.get('x-whop-company-id');

    if (!whopUserToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No Whop token' },
        { status: 401 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID required' },
        { status: 400 }
      );
    }

    // Verify Company Owner access
    let userId: string;
    try {
      const { userId: extractedUserId } = await whopCompanySdk.verifyUserToken(headersList);
      userId = extractedUserId;
      console.log('✅ Company Owner verified for promo codes:', userId);
    } catch (error) {
      console.error('❌ Company Owner verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid Company Owner access' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      code, 
      amount_off, 
      promo_type = 'percentage', 
      plan_ids = [],
      unlimited_stock = true,
      expiration_datetime = null,
      new_users_only = false 
    } = body;

    // Validate required fields
    if (!code || !amount_off) {
      return NextResponse.json({
        error: 'Code and amount_off are required'
      }, { status: 400 });
    }

    // Create promo code via Multi-Tenant Whop SDK
    const promoData = {
      code,
      amount_off: parseInt(amount_off),
      promo_type,
      plan_ids,
      unlimited_stock,
      new_users_only,
      base_currency: 'USD', // Required by Whop API
      ...(expiration_datetime && { expiration_datetime })
    };

    console.log('🎫 Creating promo code with multi-tenant SDK for company:', companyId);
    
    // Try multi-tenant REST API approach first (same as products API)
    try {
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
        console.log('✅ Multi-tenant promo code created:', promoCode.code);
        return NextResponse.json({
          success: true,
          promoCode: {
            id: promoCode.id,
            code: promoCode.code,
            amount_off: promoCode.amount_off,
            promo_type: promoCode.promo_type,
            created_at: promoCode.created_at
          }
        });
      } else {
        console.log('⚠️ Multi-tenant API failed with status:', response.status);
      }
    } catch (multiTenantError: any) {
      console.log('⚠️ Multi-tenant SDK failed, falling back to manual API:', multiTenantError?.message || 'Unknown error');
    }

    // Fallback to manual API call (legacy)
    if (!process.env.WHOP_COMPANY_API_KEY) {
      return NextResponse.json({
        error: 'Whop Company API credentials not configured for fallback'
      }, { status: 500 });
    }

    const response = await fetch('https://api.whop.com/api/v2/promo_codes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_COMPANY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(promoData)
    });

    if (!response.ok) {
      const errorData = await response.text();
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
    console.error('Error creating Whop promo code:', error);
    return NextResponse.json({
      error: 'Failed to create promo code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Company Owner authentication (same as whop-products API)
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    const companyId = headersList.get('x-whop-company-id');

    if (!whopUserToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No Whop token' },
        { status: 401 }
      );
    }

    // Verify Company Owner access
    try {
      await whopCompanySdk.verifyUserToken(headersList);
      console.log('✅ Company Owner verified for promo code list');
    } catch (error) {
      console.error('❌ Company Owner verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid Company Owner access' },
        { status: 403 }
      );
    }

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
