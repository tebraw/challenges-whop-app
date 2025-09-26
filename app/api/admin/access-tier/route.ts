import { NextRequest, NextResponse } from 'next/server';
import { whopAppSdk } from '@/lib/whop-sdk-unified';
import { ACCESS_PASS_PRODUCTS, AccessTier, coalesceTier, productIdToTier } from '@/lib/subscriptionTiers';

type TierCaps = {
  tier: AccessTier;
  canCreatePaidChallenges: boolean;
  canSetCustomEntryPrice: boolean;
  revenueSharePercent: number; // platform fee percentage
};

export async function GET(request: NextRequest) {
  try {
    // Resolve company ID from multiple sources to support iFrame embedding
    let companyId = request.headers.get('x-whop-company-id') || request.headers.get('x-company-id');
    if (!companyId) {
      // Try Whop app-config cookie (JWT-like)
      try {
        const appConfig = request.cookies.get('whop.app-config')?.value;
        if (appConfig) {
          const payload = JSON.parse(Buffer.from(appConfig.split('.')[1] || '', 'base64').toString('utf-8'));
          let extracted = payload?.did as string | undefined;
          if (extracted) {
            if (!extracted.startsWith('biz_')) extracted = `biz_${extracted}`;
            if (extracted.startsWith('biz_') && extracted.length > 10) companyId = extracted;
          }
        }
      } catch {}
    }
    if (!companyId) {
      const referer = request.headers.get('referer') || '';
      const m = referer.match(/whop\.com\/dashboard\/(biz_[^\/?#]+)/i);
      if (m) companyId = m[1];
    }
    // Accept token from header OR cookie for client-side fetches in Whop iFrame
    const headerToken = request.headers.get('x-whop-user-token');
    const cookieToken = request.cookies.get('whop_user_token')?.value;
    const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const userToken = headerToken || cookieToken || bearerToken || null;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }
    if (!userToken) {
      return NextResponse.json({ error: 'User token required' }, { status: 401 });
    }

    // Verify user and access to company
    // Ensure the SDK receives the token even if it came from cookies/bearer
    const headersForVerify = new Headers(request.headers);
    if (!headersForVerify.get('x-whop-user-token') && userToken) {
      headersForVerify.set('x-whop-user-token', userToken);
    }
    const { userId } = await whopAppSdk.verifyUserToken(headersForVerify as any);
    const hasAccess = await whopAppSdk.access.checkIfUserHasAccessToCompany({ userId, companyId });
    if (!hasAccess) {
      return NextResponse.json({ error: 'No access to company' }, { status: 403 });
    }

    // Attempt real detection via Whop receipts/subscriptions using official SDK
    let detectedTier: AccessTier | null = null;
    
    console.log('🔍 DEBUG: Starting access tier detection for company:', companyId);

    try {
      // Use official Whop SDK as recommended in documentation
      const receiptsResult = await whopAppSdk.payments.listReceiptsForCompany({
        companyId,
        first: 50, // Get enough receipts to find Access Pass purchases
      });

      console.log('📋 DEBUG: SDK receipt lookup response:', {
        companyId,
        receiptsCount: receiptsResult?.receipts?.nodes?.length || 0,
        hasPageInfo: !!receiptsResult?.receipts?.pageInfo
      });

      const receipts = receiptsResult?.receipts?.nodes || [];
        
      console.log('📋 DEBUG: Receipt lookup result:', {
        companyId,
        receiptsCount: receipts.length,
        receiptsType: typeof receipts,
        receipts: receipts.slice(0, 3) // Log first 3 receipts only
      });
        
      if (receipts.length > 0) {
        for (const receipt of receipts) {
          if (!receipt) continue;
          
          // Check Access Pass field (official way according to docs)
          const accessPassId = receipt.accessPass?.id;
          const accessPassTitle = receipt.accessPass?.title;
          
          // Also check plan ID as fallback
          const planId = receipt.plan?.id;
          
          console.log('🔍 DEBUG: Processing receipt:', {
            receiptId: receipt.id,
            accessPassId,
            accessPassTitle,
            planId,
            fullReceipt: receipt
          });
          
          // Try Access Pass ID first (most reliable)
          let tier = productIdToTier(accessPassId);
          
          // Fallback to plan ID if no Access Pass
          if (!tier && planId) {
            tier = productIdToTier(planId);
          }
          
          if (tier) {
            detectedTier = tier;
            console.log('✅ DEBUG: Found tier from receipt:', { tier, source: accessPassId ? 'accessPass' : 'plan', id: accessPassId || planId });
            break;
          }
        }
        
        if (!detectedTier) {
          console.log('❌ DEBUG: No tier detected from receipts. Expected Access Pass/Plan IDs:', {
            BASIC: ACCESS_PASS_PRODUCTS.BASIC,
            PLUS: ACCESS_PASS_PRODUCTS.PLUS,
            PRO_PLUS: ACCESS_PASS_PRODUCTS.PRO_PLUS
          });
        }
      }
    } catch (e) {
      console.error('❌ DEBUG: SDK receipt lookup failed:', e);
      // Silent fallback; we'll coalesce to Basic below
    }

    // Debug override header (non-production only)
    const debugTier = request.headers.get('x-debug-tier');
    if (debugTier === 'plus') detectedTier = 'Plus';
    if (debugTier === 'proplus') detectedTier = 'ProPlus';

    const tier = coalesceTier(detectedTier);

    // Check testing mode - grant ProPlus permissions for test company
    const isTestingMode = process.env.TESTING_MODE === 'true';
    const testCompanyId = process.env.TEST_COMPANY_ID;
    const isTestCompany = isTestingMode && testCompanyId && companyId === testCompanyId;

    if (isTestCompany) {
      console.log('🧪 TESTING MODE: Granting ProPlus access tier for company:', companyId);
    }

    const caps: TierCaps = {
      tier: isTestCompany ? 'ProPlus' : tier,
      canCreatePaidChallenges: isTestCompany || tier === 'ProPlus', // Testing mode OR ProPlus
      canSetCustomEntryPrice: true, // Company owner sets entry price freely
      revenueSharePercent: 10, // 10% platform fee (assumed on net, see docs)
    };

    return NextResponse.json(caps);
  } catch (error) {
    console.error('access-tier error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
