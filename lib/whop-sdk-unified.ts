/**
 * 🔧 UNIFIED WHOP SDK CONFIGURATION
 * Consolidates all SDK patterns for clean imports
 */
import { WhopServerSdk, makeWebhookValidator } from "@whop/api";

// 🎯 PRIMARY SDK - Official Whop Template Pattern (Experience & Dashboard)
export const whopSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  appApiKey: process.env.WHOP_APP_API_KEY ?? "fallback", // App API Key
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID, // ✅ Official template uses this
  // companyId removed - use withCompany() dynamically for multi-tenant support
});

// 🎭 APP SDK - For Dashboard Company operations with DYNAMIC company context
export const whopAppSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  appApiKey: process.env.WHOP_APP_API_KEY ?? "fallback", // App API Key for Dashboard Apps
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID, // ✅ Needed for Company operations
  // companyId removed - prevents 500 errors when accessing different companies
});

// 🏢 COMPANY SDK - For Company-specific operations (legacy compatibility)
export const whopCompanySdk = whopAppSdk; // Same configuration as official template

// 🤖 AGENT SDK - For operations explicitly requiring Agent User
export const whopAgentSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  appApiKey: process.env.WHOP_APP_API_KEY ?? "fallback",
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID, // Agent operations only
});

// 🔄 SMART SDK - Legacy compatibility
export function getWhopSdk(context: 'company' | 'experience' | 'auto' = 'auto') {
  return whopAppSdk; // Use unified App SDK for all contexts
}

// 🔧 COMPANY-SPECIFIC SDK CREATOR - Official Template Pattern for Multi-Tenant
export function createCompanyWhopSdk(companyId: string) {
  return WhopServerSdk({
    appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
    appApiKey: process.env.WHOP_APP_API_KEY ?? "fallback",
    onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID, // ✅ Official pattern
    // Create SDK instance without static companyId, then apply dynamically
  }).withCompany(companyId); // ✅ CRITICAL: Dynamic company binding prevents 500 errors
}

// Export webhook validator
export const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});
