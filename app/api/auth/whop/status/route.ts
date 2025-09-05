// app/api/auth/whop/status/route.ts
import { NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET() {
  const configured = !!(
    process.env.WHOP_API_KEY && 
    process.env.WHOP_OAUTH_CLIENT_ID &&
    process.env.WHOP_OAUTH_CLIENT_SECRET &&
    process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
  );

  const sdkStatus = whopSdk ? 'initialized' : 'not_initialized';

  // Test SDK connection if available
  let apiConnectionTest = 'not_tested';
  if (whopSdk) {
    try {
      // Try to list products to test API connection
      await whopSdk.listProducts();
      apiConnectionTest = 'success';
    } catch (error) {
      apiConnectionTest = 'failed';
      console.error('Whop API connection test failed:', error);
    }
  }

  return NextResponse.json({
    configured,
    sdkStatus,
    apiConnectionTest,
    environment: {
      hasAppId: !!process.env.NEXT_PUBLIC_WHOP_APP_ID,
      hasApiKey: !!process.env.WHOP_API_KEY,
      hasClientId: !!process.env.WHOP_OAUTH_CLIENT_ID,
      hasClientSecret: !!process.env.WHOP_OAUTH_CLIENT_SECRET,
      hasWebhookSecret: !!process.env.WHOP_WEBHOOK_SECRET,
      hasAppUrl: !!process.env.WHOP_APP_URL,
      hasCompanyId: !!process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
    },
    message: configured 
      ? `Whop SDK is ${sdkStatus} - API test: ${apiConnectionTest}` 
      : 'Whop integration needs configuration - check environment variables',
    devMode: process.env.DEV_MODE === 'true',
    timestamp: new Date().toISOString()
  });
}
