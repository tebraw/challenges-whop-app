// app/api/auth/whop/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleWhopCallback } from '@/lib/whop/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('🔍 Whop callback received:', { code: !!code, error, state });

    if (error) {
      console.error('Whop OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/auth/error?message=Authentication failed: ${error}`, request.url)
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/auth/error?message=No authorization code received', request.url)
      );
    }

    // Handle the callback and create session
    console.log('🔄 Processing Whop callback...');
    const session = await handleWhopCallback(code);

    if (!session) {
      console.error('Failed to create session from Whop callback');
      return NextResponse.redirect(
        new URL('/auth/error?message=Failed to create session', request.url)
      );
    }

    console.log('✅ Whop session created successfully:', { 
      userId: session.userId, 
      email: session.email 
    });

    // Redirect to the app with success
    const redirectUrl = state || '/admin';
    console.log('🔄 Redirecting to:', redirectUrl);
    
    return NextResponse.redirect(new URL(redirectUrl, request.url));

  } catch (error) {
    console.error('Error in Whop callback:', error);
    return NextResponse.redirect(
      new URL(`/auth/error?message=Authentication failed: ${(error as Error).message}`, request.url)
    );
  }
}
