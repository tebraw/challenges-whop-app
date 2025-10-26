// Whop Access Pass product IDs (provided by user)
export const ACCESS_PASS_PRODUCTS = {
  BASIC: 'prod_YByUE3J5oT4Fq',
  STARTER: 'prod_lSScR3R6CR94J',
  PROFESSIONAL: 'prod_ql9UrCigkkosC',
} as const;

export type AccessTier = 'Basic' | 'Starter' | 'Professional';

export function getUpgradeCheckoutUrl(tier: Exclude<AccessTier, 'Basic'>): string {
  const id = tier === 'Starter' ? ACCESS_PASS_PRODUCTS.STARTER : ACCESS_PASS_PRODUCTS.PROFESSIONAL;
  return `https://whop.com/checkout/${id}`;
}

export function productIdToTier(productId?: string | null): AccessTier | null {
  if (!productId) return null;
  if (productId === ACCESS_PASS_PRODUCTS.STARTER) return 'Starter'; // Whop plan is named "Starter" and we map it to "Starter" internally
  if (productId === ACCESS_PASS_PRODUCTS.PROFESSIONAL) return 'Professional';
  if (productId === ACCESS_PASS_PRODUCTS.BASIC) return 'Basic';
  return null;
}

// Very lightweight placeholder until we wire real receipt lookups
export function coalesceTier(found: AccessTier | null | undefined): AccessTier {
  return found ?? 'Basic';
}
