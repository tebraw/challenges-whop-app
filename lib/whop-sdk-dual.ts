/**
 * 🎯 OFFICIAL WHOP SDK CONFIGURATION
 * 
 * Based on official Whop Documentation:
 * https://docs.whop.com/sdk/whop-api-client
 */
import { WhopServerSdk, makeWebhookValidator } from "@whop/api";

// 🏢 OFFICIAL WHOP SDK - Universal Configuration
export const whopSdk = WhopServerSdk({
  // App ID from Whop Dashboard
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  
  // App API Key - REQUIRED for all requests
  appApiKey: process.env.WHOP_API_KEY ?? "fallback",
  
  // Agent User ID - REQUIRED for user token operations (Experience views)
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
  
  // Company ID - OPTIONAL, can be set dynamically with withCompany()
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
});

// 🔄 LEGACY ALIASES - For backwards compatibility
export const whopAppSdk = whopSdk;
export const whopExperienceSdk = whopSdk;
export const whopCompanySdk = whopSdk;

// Export webhook validator
export const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

// 🎯 OFFICIAL USAGE PATTERNS (per Whop Documentation):
// 
// Experience Views: whopSdk.verifyUserToken(headers) + whopSdk.users.getUser()
// Dashboard Views: whopSdk.withCompany(companyId).payments.listReceiptsForCompany()
// Company Operations: whopSdk.withCompany(companyId).access.checkIfUserHasAccessToCompany()
// 
// Dynamic Company: whopSdk.withCompany("biz_123").someMethod()
// Dynamic User: whopSdk.withUser("user_456").someMethod()