// Whop Access Pass product IDs (provided by user)
export const ACCESS_PASS_PRODUCTS = {
  BASIC: 'prod_YByUE3J5oT4Fq',
  PRE: 'prod_ttlhdSPEzAXeO',
  PRO_PLUS: 'prod_9YkNJGjxSgRyE',
} as const;

export type AccessTier = 'Basic' | 'Pre' | 'ProPlus';

export function getUpgradeCheckoutUrl(tier: Exclude<AccessTier, 'Basic'>): string {
  const id = tier === 'Pre' ? ACCESS_PASS_PRODUCTS.PRE : ACCESS_PASS_PRODUCTS.PRO_PLUS;
  return `https://whop.com/checkout/${id}`;
}

export function productIdToTier(productId?: string | null): AccessTier | null {
  if (!productId) return null;
  if (productId === ACCESS_PASS_PRODUCTS.PRE) return 'Pre'; // Whop plan is named "Pre" and we map it to "Pre" internally
  if (productId === ACCESS_PASS_PRODUCTS.PRO_PLUS) return 'ProPlus';
  if (productId === ACCESS_PASS_PRODUCTS.BASIC) return 'Basic';
  return null;
}

// Very lightweight placeholder until we wire real receipt lookups
export function coalesceTier(found: AccessTier | null | undefined): AccessTier {
  return found ?? 'Basic';
}
