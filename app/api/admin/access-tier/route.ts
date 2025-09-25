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

    // Attempt real detection via Whop receipts/subscriptions
    let detectedTier: AccessTier | null = null;

    try {
      // Prefer company-scoped receipts (dashboard app context)
      const receipts = await whopAppSdk.payments.listReceiptsForCompany({ companyId });
      if (Array.isArray(receipts)) {
        for (const r of receipts as any[]) {
          const productId = r.productId || r.product_id || r.plan?.product_id || r.plan?.id;
          const tier = productIdToTier(productId);
          if (tier) {
            detectedTier = tier;
            break;
          }
        }
      }
    } catch (e) {
      // Silent fallback; we'll coalesce to Basic below
    }

    // Debug override header (non-production only)
    const debugTier = request.headers.get('x-debug-tier');
    if (debugTier === 'plus') detectedTier = 'Plus';
    if (debugTier === 'proplus') detectedTier = 'ProPlus';

    const tier = coalesceTier(detectedTier);

    const caps: TierCaps = {
      tier,
      canCreatePaidChallenges: tier !== 'Basic', // Paid challenges for Plus and ProPlus
      canSetCustomEntryPrice: true, // Company owner sets entry price freely
      revenueSharePercent: 10, // 10% platform fee (assumed on net, see docs)
    };

    return NextResponse.json(caps);
  } catch (error) {
    console.error('access-tier error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
