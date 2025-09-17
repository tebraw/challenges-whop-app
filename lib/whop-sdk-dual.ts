/**
 * 🎯 WHOP DASHBOARD APP STANDARD SDK CONFIGURATION
 * 
 * Based on official Whop Documentation:
 * https://docs.whop.com/apps/tutorials/dashboard-apps
 */
import { WhopServerSdk, makeWebhookValidator } from "@whop/api";

// 🏢 WHOP APP SDK - Official Dashboard App Configuration
export const whopAppSdk = WhopServerSdk({
  // App ID from Whop Dashboard
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  
  // App API Key - CRITICAL: Use WHOP_API_KEY for Dashboard Apps
  appApiKey: process.env.WHOP_API_KEY ?? "fallback",
  
  // DO NOT set companyId or onBehalfOfUserId here statically
  // Dashboard Apps handle these dynamically per request
});

// 🔄 LEGACY SUPPORT - For backwards compatibility with existing routes
export const whopCompanySdk = whopAppSdk;

// Export webhook validator
export const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

// 🎯 OFFICIAL USAGE PATTERNS:
// - Dashboard Apps: Use whopAppSdk with dynamic companyId
// - User Verification: whopSdk.verifyUserToken(headers)
// - Company Access: whopSdk.access.checkIfUserHasAccessToCompany({userId, companyId})
// - Company Data: whopSdk.payments.listReceiptsForCompany({companyId, first: 10})