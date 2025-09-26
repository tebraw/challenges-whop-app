/**
 * 🔧 UNIFIED WHOP SDK CONFIGURATION
 * Consolidates all SDK patterns for clean imports
 */
import { WhopServerSdk, makeWebhookValidator } from "@whop/api";

// 🎯 PRIMARY SDK - Dashboard App Standard (Company Operations)
export const whopSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  appApiKey: process.env.WHOP_APP_API_KEY ?? "fallback", // App API Key for Dashboard Apps
  // onBehalfOfUserId removed for Company Access - follows official Whop Dashboard App template
});

// 🎭 APP SDK - For Experience/Member operations  
export const whopAppSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  appApiKey: process.env.WHOP_APP_API_KEY ?? "fallback", // App API Key
  // onBehalfOfUserId removed for Company Access - was blocking listReceiptsForCompany()
});

// 🏢 COMPANY SDK - For Company-specific operations (fallback)
export const whopCompanySdk = whopAppSdk; // Use same SDK with App API Key

// 🤖 AGENT SDK - For operations requiring Agent User (notifications, etc.)
export const whopAgentSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  appApiKey: process.env.WHOP_APP_API_KEY ?? "fallback",
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID, // Only for Agent operations
});

// 🔄 SMART SDK - Legacy compatibility
export function getWhopSdk(context: 'company' | 'experience' | 'auto' = 'auto') {
  return whopAppSdk; // Use unified App SDK for all contexts
}

// 🔧 COMPANY-SPECIFIC SDK CREATOR
export function createCompanyWhopSdk(companyId: string) {
  return WhopServerSdk({
    appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
    appApiKey: process.env.WHOP_APP_API_KEY ?? "fallback",
    // onBehalfOfUserId removed for Company Access compatibility
  }).withCompany(companyId);
}

// Export webhook validator
export const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});