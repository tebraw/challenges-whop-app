import { WhopServerSdk, makeWebhookValidator } from "@whop/api";

// ✅ MULTI-TENANT SDK CONFIGURATION
// This SDK uses the App API Key which works for all company installations
export const whopSdk = WhopServerSdk({
  // App ID - same for all installations
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",

  // App API Key - same for all installations (multi-tenant ready)
  appApiKey: process.env.WHOP_API_KEY ?? "fallback",

  // Agent user for API requests
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,

  // NO hardcoded companyId - will be set dynamically per request
  // companyId: REMOVED FOR MULTI-TENANT SUPPORT
});

// Legacy Company-specific SDK for current development
// ⚠️ This will be replaced with dynamic company context
export const whopCompanySdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  appApiKey: process.env.WHOP_COMPANY_API_KEY ?? "fallback",
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
});

// Export webhook validator
export const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

// ✅ MULTI-TENANT HELPER FUNCTION
// Create company-specific SDK instance for each request
export function createCompanyWhopSdk(companyId: string) {
  return whopSdk.withCompany(companyId);
}
