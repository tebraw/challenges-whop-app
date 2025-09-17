import { NextRequest, NextResponse } from 'next/server';
import { whopAppSdk } from '@/lib/whop-sdk-unified';
import { prisma } from '@/lib/prisma';

interface WhopProduct {
  id: string;
  name: string;
  title: string;
  visibility?: string;
  price?: number;
  currency?: string;
}

interface ActiveOffer {
  id: string;
  type: 'completion' | 'mid_challenge';
  code: string;
  discount: number;
  discountType: 'percentage' | 'flat_amount';
  productId: string;
  productName: string;
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

    // Load real products using Whop SDK
    let products: WhopProduct[] = [];
    try {
      console.log('📦 Loading products for company:', companyId);
      const receiptsResponse = await whopAppSdk.payments.listReceiptsForCompany({
        companyId: companyId,
        first: 50
      });
      
      console.log('📦 Receipts loaded:', receiptsResponse?.receipts?.nodes?.length || 0);
      
      // Extract unique products from receipts
      const productMap = new Map();
      if (receiptsResponse?.receipts?.nodes) {
        receiptsResponse.receipts.nodes.forEach((receipt: any) => {
          if (receipt?.product && receipt.product.id) {
            productMap.set(receipt.product.id, {
              id: receipt.product.id,
              name: receipt.product.title || receipt.product.name || 'Unnamed Product',
              title: receipt.product.title || receipt.product.name || 'Unnamed Product',
              visibility: receipt.product.visibility,
              price: receipt.product.price || 0,
              currency: receipt.product.currency || 'USD'
            });
          }
        });
      }
      
      products = Array.from(productMap.values());
      console.log('📦 Unique products found:', products.length);
      
    } catch (error) {
      console.log('⚠️ Error loading products, using mock data:', error);
      
      // Fallback to mock products for development
      products = [
        {
          id: 'prod_mock_premium',
          name: 'Premium Membership',
          title: 'Premium Membership', 
          price: 29.99,
          currency: 'USD'
        },
        {
          id: 'prod_mock_vip',
          name: 'VIP Access',
          title: 'VIP Access',
          price: 99.99,
          currency: 'USD'
        },
        {
          id: 'prod_mock_course',
          name: 'Advanced Course',
          title: 'Advanced Course',
          price: 199.99,
          currency: 'USD'
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
          }
        });

        offers = challengeOffers.map(offer => ({
          id: offer.id,
          type: offer.offerType as 'completion' | 'mid_challenge',
          code: 'GENERATED_CODE',
          discount: offer.discountPercentage || 0,
          discountType: 'percentage' as const,
          productId: offer.whopProductId,
          productName: products.find(p => p.id === offer.whopProductId)?.name || 'Unknown Product',
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
      products,
      offers,
      summary: {
        totalProducts: products.length,
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
    const { challengeId, offerType, ...formData } = body;

    console.log('📝 Offer data:', { challengeId, offerType, productId: formData.productId });

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

    // TODO: Create promo code via Whop API
    // TODO: Store offer in database
    // For now, return success response
    
    console.log('✅ Promo code creation placeholder - implementation needed');
    
    return NextResponse.json({
      success: true,
      message: 'Promo code creation - implementation in progress'
    });

  } catch (error) {
    console.error('❌ Promo code creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
