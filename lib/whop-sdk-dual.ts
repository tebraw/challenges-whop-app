/**
 * 🔧 DUAL WHOP SDK CONFIGURATION
 * 
 * Problem: We need TWO different API keys for different use cases:
 * 1. COMPANY API KEY - for Company Owner operations (products, company data)
 * 2. APP API KEY - for Experience operations (member access, experience data)
 */
import { WhopServerSdk, makeWebhookValidator } from "@whop/api";

// 🏢 COMPANY SDK - for Company Owner operations
export const whopCompanySdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  appApiKey: process.env.WHOP_API_KEY ?? "fallback", // Company API Key
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
});

// 🎭 APP SDK - for Experience/Member operations  
export const whopAppSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  appApiKey: process.env.WHOP_APP_API_KEY ?? "fallback", // App API Key (original)
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
});

// 🔄 SMART SDK - automatically choose the right SDK based on context
export function getWhopSdk(context: 'company' | 'experience' | 'auto' = 'auto') {
  switch (context) {
    case 'company':
      return whopCompanySdk;
    case 'experience':
      return whopAppSdk;
    case 'auto':
    default:
      // For backwards compatibility, default to company SDK
      return whopCompanySdk;
  }
}

// Export webhook validator
export const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

// 🎯 USAGE GUIDE:
// - Use whopCompanySdk for: products, company data, admin operations
// - Use whopAppSdk for: experience access, member verification, user tokens
// - Use getWhopSdk('company') or getWhopSdk('experience') for explicit control
