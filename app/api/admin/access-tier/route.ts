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
    const companyId = request.headers.get('x-whop-company-id');
    const userToken = request.headers.get('x-whop-user-token');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }
    if (!userToken) {
      return NextResponse.json({ error: 'User token required' }, { status: 401 });
    }

    // Verify user and access to company
    const { userId } = await whopAppSdk.verifyUserToken(request.headers as any);
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
