// app/api/auth/whop/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/admin';

    // Whop OAuth parameters
    const clientId = process.env.WHOP_OAUTH_CLIENT_ID;
    const redirectUri = process.env.WHOP_OAUTH_REDIRECT_URI || 
                       `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/whop/callback`;

    if (!clientId) {
      // Development fallback - redirect to dev admin
      console.warn('No Whop OAuth configured - using dev admin');
      return NextResponse.redirect(new URL('/api/auth/dev-admin', request.url));
    }

    // Build Whop OAuth URL
    const authUrl = new URL('https://whop.com/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'user:read memberships:read');
    authUrl.searchParams.set('state', returnTo);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error creating Whop auth URL:', error);
    return NextResponse.redirect(new URL('/auth/error?message=Authentication setup failed', request.url));
  }
}
