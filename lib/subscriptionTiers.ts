// Whop Access Pass product IDs (provided by user)
export const ACCESS_PASS_PRODUCTS = {
  BASIC: 'prod_YByUE3J5oT4Fq',
  PLUS: 'prod_3lTSwjRreFDwP',
  PRO_PLUS: 'prod_9YkNJGjxSgRyE',
} as const;

export type AccessTier = 'Basic' | 'Plus' | 'ProPlus';

export function getUpgradeCheckoutUrl(tier: Exclude<AccessTier, 'Basic'>): string {
  const id = tier === 'Plus' ? ACCESS_PASS_PRODUCTS.PLUS : ACCESS_PASS_PRODUCTS.PRO_PLUS;
  return `https://whop.com/checkout/${id}`;
}

export function productIdToTier(productId?: string | null): AccessTier | null {
  if (!productId) return null;
  if (productId === ACCESS_PASS_PRODUCTS.PLUS) return 'Plus';
  if (productId === ACCESS_PASS_PRODUCTS.PRO_PLUS) return 'ProPlus';
  if (productId === ACCESS_PASS_PRODUCTS.BASIC) return 'Basic';
  return null;
}

// Very lightweight placeholder until we wire real receipt lookups
export function coalesceTier(found: AccessTier | null | undefined): AccessTier {
  return found ?? 'Basic';
}
