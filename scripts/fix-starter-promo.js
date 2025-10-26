// Quick fix script to update access-tier route for Starter promo codes
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/api/admin/access-tier/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix 1: Update the debug log to include Starter tier
content = content.replace(
  `willGrantPaidChallenges: isTestCompany || tier === 'Professional' || (hasPromoCode && promoTier === 'Professional')`,
  `willGrantPaidChallenges: isTestCompany || tier === 'Professional' || tier === 'Starter' || (hasPromoCode && promoTier)`
);

// Fix 2: Update tier assignment to support Starter promo codes
const oldTierLogic = `const caps: TierCaps = {
      tier: isTestCompany ? 'Professional' : (hasPromoCode && promoTier === 'Professional' ? 'Professional' : tier),
      canCreatePaidChallenges: isTestCompany || tier === 'Professional' || (hasPromoCode && promoTier === 'Professional'),`;

const newTierLogic = `// Determine final tier with promo code support
    let finalTier: AccessTier = tier;
    if (isTestCompany) {
      finalTier = 'Professional';
    } else if (hasPromoCode && promoTier) {
      // Promo code grants access to specified tier
      finalTier = promoTier as AccessTier;
    }

    const caps: TierCaps = {
      tier: finalTier,
      canCreatePaidChallenges: isTestCompany || finalTier === 'Professional' || finalTier === 'Starter',`;

content = content.replace(oldTierLogic, newTierLogic);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ access-tier route updated successfully for Starter promo codes!');
