// Quick debug script to check Plan IDs
console.log('🔍 DEBUGGING PLAN IDS:');
console.log('Plus Plan ID:', process.env.NEXT_PUBLIC_PLUS_PLAN_ID);
console.log('ProPlus Plan ID:', process.env.NEXT_PUBLIC_PROPLUS_PLAN_ID);
console.log('Plus Access Pass ID:', process.env.NEXT_PUBLIC_PLUS_ACCESS_PASS_ID);
console.log('ProPlus Access Pass ID:', process.env.NEXT_PUBLIC_PROPLUS_ACCESS_PASS_ID);

// Test what would be passed to inAppPurchase()
const plusPlanId = process.env.NEXT_PUBLIC_PLUS_PLAN_ID || 'plan_plus_placeholder';
const proplusPlanId = process.env.NEXT_PUBLIC_PROPLUS_PLAN_ID || 'plan_proplus_placeholder';

console.log('Plus Plan ID that would be used:', plusPlanId);
console.log('ProPlus Plan ID that would be used:', proplusPlanId);