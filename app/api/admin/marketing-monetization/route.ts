import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopAppSdk } from '@/lib/whop-sdk-dual';

/**
 * 🎯 WHOP DASHBOARD APP STANDARD - Marketing & Monetization API
 * 
 * OFFICIAL IMPLEMENTATION based on:
 * https://docs.whop.com/apps/tutorials/dashboard-apps
 * 
 * AUTHENTICATION STRATEGY (Official Whop):
 * 1. whopSdk.verifyUserToken(headers) - verify user in iFrame context
 * 2. whopSdk.access.checkIfUserHasAccessToCompany() - check admin access
 * 3. whopSdk.payments.listReceiptsForCompany() - load real company data
 * 
 * REQUIRED PERMISSIONS (from documentation):
 * - payment:basic:read
 * - access_pass:basic:read  
 * - member:basic:read
 * - plan:basic:read
 * - promo_code:basic:read
 */

export async function GET(request: NextRequest) {
  console.log('🎯 Marketing & Monetization API - WHOP DASHBOARD APP STANDARD');
  
  try {
    const headersList = await headers();
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');
    
    if (!challengeId) {
      return NextResponse.json(
        { error: 'challengeId is required' },
        { status: 400 }
      );
    }

    // Step 1: Verify user token (Whop Dashboard App Standard)
    console.log('🔍 Step 1: Verifying user token via Whop SDK...');
    const { userId } = await whopAppSdk.verifyUserToken(headersList);
    console.log('✅ User token verified:', userId);
    
    // Step 2: Get company ID from headers (Dashboard App context)
    const companyId = headersList.get('x-whop-company-id') || 
                     headersList.get('x-company-id') ||
                     headersList.get('company-id');
    
    if (!companyId) {
      console.log('❌ No company ID found in headers');
      return NextResponse.json(
        { error: 'Company ID required for Dashboard App access' },
        { status: 400 }
      );
    }
    
    console.log('🏢 Step 2: Company ID from headers:', companyId);
    
    // Step 3: Check if user has admin access to company (Whop Standard)
    console.log('🔐 Step 3: Checking company access level...');
    const accessResult = await whopAppSdk.access.checkIfUserHasAccessToCompany({
      userId,
      companyId,
    });
    
    console.log('📊 Access check result:', accessResult);
    
    if (accessResult.accessLevel !== 'admin') {
      console.log('❌ User does not have admin access to company');
      return NextResponse.json(
        { error: 'Admin access to company required' },
        { status: 403 }
      );
    }
    
    console.log('✅ Step 3: Admin access granted for company:', companyId);

    // Step 4: Load real company products (Official Whop Documentation Method)
    console.log('📦 Step 4: Loading real company products via official SDK...');
    
    let products: Array<{
      id: string;
      name: string;
      title: string;
      plans: Array<{ id: string; name: string; price: number; }>;
    }> = [];
    
    try {
      // OFFICIAL METHOD from Whop Documentation:
      // https://docs.whop.com/apps/tutorials/dashboard-apps
      console.log('🎯 Calling whopSdk.payments.listReceiptsForCompany...');
      const companyReceipts = await whopAppSdk.payments.listReceiptsForCompany({
        companyId,
        first: 5, // Lower limit to avoid "complexity limits" (per documentation)
      });
      
      console.log('✅ Company receipts received:', !!companyReceipts);
      console.log('📊 Receipts data structure:', {
        hasReceipts: !!companyReceipts?.receipts,
        hasNodes: !!companyReceipts?.receipts?.nodes,
        nodeCount: companyReceipts?.receipts?.nodes?.length || 0
      });
      
      if (companyReceipts?.receipts?.nodes && companyReceipts.receipts.nodes.length > 0) {
        console.log('📦 Processing', companyReceipts.receipts.nodes.length, 'real receipts...');
        
        // Extract unique products and plans from real receipts
        const productMap = new Map<string, {
          id: string;
          name: string;
          title: string;
          plans: Array<{ id: string; name: string; price: number; }>;
        }>();
        
        companyReceipts.receipts.nodes.forEach((receipt, index) => {
          console.log(`📋 Receipt ${index + 1}:`, {
            id: receipt?.id,
            hasPlan: !!receipt?.plan,
            planId: receipt?.plan?.id,
            planTitle: receipt?.plan?.title
          });
          
          if (receipt?.plan) {
            const plan = receipt.plan;
            const productId = `product-${plan.id}`;
            
            if (!productMap.has(productId)) {
              productMap.set(productId, {
                id: productId,
                name: plan.title || `Product ${plan.id}`,
                title: plan.title || `Product ${plan.id}`,
                plans: []
              });
              console.log('🆕 Created product:', plan.title);
            }
            
            // Add plan to product (avoid duplicates)
            const productData = productMap.get(productId)!;
            if (!productData.plans.find(p => p.id === plan.id)) {
              productData.plans.push({
                id: plan.id,
                name: plan.title || `Plan ${plan.id}`,
                price: plan.initialPrice || plan.renewalPrice || 0
              });
              console.log(`📋 Added plan: ${plan.title} (${plan.initialPrice || plan.renewalPrice || 0})`);
            }
          }
        });
        
        products = Array.from(productMap.values());
        console.log('✅ Processed real company products:', products.length);
        
      } else {
        console.log('⚠️ No receipts found - company might not have any sales yet');
      }
      
    } catch (error) {
      console.log('❌ Real product loading failed:', error);
      console.log('📋 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
      });
    }
    
    // Fallback: If no real products found, show that the system works
    if (products.length === 0) {
      console.log('🎯 No real products found - this is normal for new companies');
      console.log('💡 Company owners can create products in their Whop dashboard');
      
      // Provide informative placeholder that explains the system
      products = [
        { 
          id: 'placeholder-info', 
          name: 'ℹ️ No Products Found', 
          title: 'ℹ️ No Products Found', 
          plans: [
            { 
              id: 'info-plan', 
              name: 'Create products in your Whop dashboard to see them here', 
              price: 0 
            }
          ] 
        }
      ];
    }

    // Step 5: Load existing promo codes for this challenge
    console.log('🎫 Step 5: Loading existing promo codes...');
    const existingPromoCodes: Array<any> = []; // TODO: Load from database
    
    // Step 6: Return complete data for Marketing & Monetization UI
    const responseData = {
      success: true,
      company: {
        id: companyId,
        userId: userId,
        accessLevel: accessResult.accessLevel
      },
      challenge: {
        id: challengeId,
      },
      products: products,
      promoCodes: existingPromoCodes,
      debug: {
        whopStandard: true,
        authMethod: 'whopSdk.verifyUserToken + access.checkIfUserHasAccessToCompany',
        productsSource: products.length > 0 && products[0].id !== 'placeholder-info' 
          ? 'real_company_receipts_via_official_sdk' 
          : 'no_real_products_found_placeholder',
        receiptsAPI: 'whopSdk.payments.listReceiptsForCompany',
        permissions: ['payment:basic:read', 'access_pass:basic:read', 'member:basic:read', 'plan:basic:read', 'promo_code:basic:read']
      }
    };
    
    console.log('🎉 Marketing & Monetization data ready:', {
      productsCount: products.length,
      promoCodesCount: existingPromoCodes.length,
      companyId: companyId,
      challengeId: challengeId
    });
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('💥 Marketing & Monetization API Error:', error);
    
    // Enhanced error context for debugging
    return NextResponse.json(
      { 
        error: 'Marketing & Monetization API failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        whopStandard: true,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// TODO: Implement POST/PUT/DELETE methods with same Whop Dashboard App Standard
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'POST method - implementing Whop Dashboard App Standard...' },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'DELETE method - implementing Whop Dashboard App Standard...' },
    { status: 501 }
  );
}