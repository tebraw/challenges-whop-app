// app/api/auth/whop/status/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const configured = !!(
    process.env.WHOP_OAUTH_CLIENT_ID && 
    process.env.WHOP_OAUTH_CLIENT_SECRET &&
    process.env.WHOP_API_KEY
  );

  return NextResponse.json({
    configured,
    hasClientId: !!process.env.WHOP_OAUTH_CLIENT_ID,
    hasClientSecret: !!process.env.WHOP_OAUTH_CLIENT_SECRET,
    hasApiKey: !!process.env.WHOP_API_KEY,
    message: configured 
      ? 'Whop OAuth is configured and ready' 
      : 'Whop OAuth needs configuration - using dev mode'
  });
}
