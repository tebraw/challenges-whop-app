/**
 * 🎯 OFFICIAL WHOP SDK CONFIGURATION
 * 
 * Based on official Whop Documentation:
 * https://docs.whop.com/sdk/whop-api-client
 * 
 * FIXED: Removed permanent onBehalfOfUserId to allow Experience user tokens
 */
import { WhopServerSdk, makeWebhookValidator } from "@whop/api";

// 🏢 OFFICIAL WHOP SDK - Universal Configuration (CORRECTED)
export const whopSdk = WhopServerSdk({
  // App ID from Whop Dashboard
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  
  // App API Key - REQUIRED for all requests
  appApiKey: process.env.WHOP_API_KEY ?? "fallback",
  
  // onBehalfOfUserId: REMOVED - Experience views need real user tokens from iFrame headers
  // Agent User ID can be set dynamically with withUser() for Dashboard operations
  
  // Company ID - OPTIONAL, can be set dynamically with withCompany()
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
});

// 🔄 LEGACY ALIASES - For backwards compatibility
export const whopAppSdk = whopSdk;
export const whopExperienceSdk = whopSdk;
export const whopCompanySdk = whopSdk;

// 🎯 DYNAMIC SDK HELPERS - For specific use cases
export const getSDKWithAgent = () => WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  appApiKey: process.env.WHOP_API_KEY ?? "fallback",
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
});

// Export webhook validator
export const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

// 🎯 OFFICIAL USAGE PATTERNS (per Whop Documentation):
// 
// Experience Views: whopSdk.verifyUserToken(headers) - uses real user token from iFrame
// Dashboard Views: whopSdk.withCompany(companyId).payments.listReceiptsForCompany()
// Company Operations: whopSdk.withCompany(companyId).access.checkIfUserHasAccessToCompany()
// Agent Operations: getSDKWithAgent().someMethod() - when you need the agent user
// 
// Dynamic Company: whopSdk.withCompany("biz_123").someMethod()
// Dynamic User: whopSdk.withUser("user_456").someMethod()