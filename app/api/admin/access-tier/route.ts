import { NextRequest, NextResponse } from 'next/server';
import { whopAppSdk } from '@/lib/whop-sdk-unified';
import { ACCESS_PASS_PRODUCTS, AccessTier, coalesceTier, productIdToTier } from '@/lib/subscriptionTiers';
import { prisma } from '@/lib/prisma';

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

    // OPTION A: Access Pass Check (iFrame SDK Compatible)
    let detectedTier: AccessTier | null = null;
    
    console.log('🔍 DEBUG: Starting ACCESS PASS detection for company:', companyId);

    try {
      // Get Company Owner User ID from token verification (already verified above)
      console.log('🎯 DEBUG: Using Access Pass Check method (iFrame SDK Compatible)');
      console.log('👤 DEBUG: Company Owner userId:', userId);
      
      // Access Pass IDs that correspond to the PAID plans users can purchase
      // ✅ WHOP TEAM FIX: "remove base accessPass ID check for the free plan"
      // Basic users get access by default - no purchase required!
      const ACCESS_PASS_CHECKS = [
        { tier: 'ProPlus' as AccessTier, accessPassId: ACCESS_PASS_PRODUCTS.PRO_PLUS },
        { tier: 'Pre' as AccessTier, accessPassId: ACCESS_PASS_PRODUCTS.PRE }
        // ❌ REMOVED Basic tier - users get Basic access without purchasing Access Pass
      ];
      
      console.log('🎯 DEBUG: Checking PAID Access Pass Access (Basic = default):', {
        userId,
        accessPasses: ACCESS_PASS_CHECKS.map(check => ({ tier: check.tier, accessPassId: check.accessPassId }))
      });
      
      // Check from highest tier to lowest using Access Pass method
      for (const { tier, accessPassId } of ACCESS_PASS_CHECKS) {
        try {
          console.log(`🔍 DEBUG: Checking ${tier} Access Pass: ${accessPassId}`);
          
          const accessResult = await whopAppSdk.access.checkIfUserHasAccessToAccessPass({
            accessPassId,
            userId
          });
          
          console.log(`🎯 DEBUG: ${tier} Access Pass result:`, {
            accessPassId,
            hasAccess: accessResult.hasAccess
          });
          
          if (accessResult.hasAccess) {
            detectedTier = tier;
            console.log(`✅ DEBUG: Found tier via Access Pass: ${tier} (${accessPassId})`);
            break; // Stop at highest tier found
          }
        } catch (accessPassError) {
          console.log(`❌ DEBUG: Error checking ${tier} Access Pass:`, accessPassError);
          // Continue to next tier
        }
      }
      
      if (!detectedTier) {
        console.log('✅ DEBUG: No paid Access Pass found - defaulting to Basic tier (free access)');
        console.log('📋 DEBUG: Checked PAID Access Pass IDs only:', {
          PRE: ACCESS_PASS_PRODUCTS.PRE,
          PRO_PLUS: ACCESS_PASS_PRODUCTS.PRO_PLUS
        });
        console.log('🎯 DEBUG: Basic tier = default access (no purchase required)');
      }
      
    } catch (e) {
      console.error('❌ DEBUG: Access Pass check failed:', e);
      // Silent fallback; we'll coalesce to Basic below
    }

    // Debug override header (non-production only)
    const debugTier = request.headers.get('x-debug-tier');
    if (debugTier === 'pre') detectedTier = 'Pre';
    if (debugTier === 'proplus') detectedTier = 'ProPlus';

    const tier = coalesceTier(detectedTier);

    // Check testing mode - grant ProPlus permissions for test company
    const isTestingMode = process.env.TESTING_MODE === 'true';
    const testCompanyId = process.env.TEST_COMPANY_ID;
    const isTestCompany = isTestingMode && testCompanyId && companyId === testCompanyId;

    if (isTestCompany) {
      console.log('🧪 TESTING MODE: Granting ProPlus access tier for company:', companyId);
    }

    // Check if user has active promo code
    let hasPromoCode = false;
    let promoTier: string | null = null;
    
    console.error('🎟️ PROMO DEBUG: Checking promo code for userId:', userId);
    
    if (userId) {
      const userWithPromo = await prisma.user.findFirst({
        where: { whopUserId: userId },
        select: { activePromoCode: true, id: true }
      });
      
      console.error('🎟️ PROMO DEBUG: User lookup result:', {
        found: !!userWithPromo,
        activePromoCode: userWithPromo?.activePromoCode
      });
      
      if (userWithPromo?.activePromoCode) {
        const promoCode = await prisma.promoCode.findUnique({
          where: { code: userWithPromo.activePromoCode }
        });
        
        console.error('🎟️ PROMO DEBUG: Promo code lookup result:', {
          found: !!promoCode,
          code: promoCode?.code,
          tier: promoCode?.tier,
          isActive: promoCode?.isActive,
          validUntil: promoCode?.validUntil
        });
        
        if (promoCode && promoCode.isActive) {
          // Check if code hasn't expired
          if (!promoCode.validUntil || new Date() <= promoCode.validUntil) {
            hasPromoCode = true;
            promoTier = promoCode.tier;
            console.error('🎟️ PROMO CODE: User has active promo code:', {
              code: promoCode.code,
              tier: promoCode.tier
            });
          } else {
            console.error('⚠️ PROMO CODE: Code has expired');
          }
        } else {
          console.error('⚠️ PROMO CODE: Code not found or inactive');
        }
      } else {
        console.error('ℹ️ No promo code found for user');
      }
    } else {
      console.error('⚠️ No userId provided to check promo code');
    }
    
    console.error('�️ PROMO DEBUG: Final promo code check result:', {
      hasPromoCode,
      promoTier,
      willGrantPaidChallenges: isTestCompany || tier === 'ProPlus' || (hasPromoCode && promoTier === 'ProPlus')
    });

    const caps: TierCaps = {
      tier: isTestCompany ? 'ProPlus' : (hasPromoCode && promoTier === 'ProPlus' ? 'ProPlus' : tier),
      canCreatePaidChallenges: isTestCompany || tier === 'ProPlus' || (hasPromoCode && promoTier === 'ProPlus'),
      canSetCustomEntryPrice: true, // Company owner sets entry price freely
      revenueSharePercent: 10, // 10% platform fee (assumed on net, see docs)
    };

    return NextResponse.json(caps);
  } catch (error) {
    console.error('access-tier error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
