// app/api/auth/whop/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleWhopCallback } from '@/lib/whop/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Whop OAuth error:', error);
      return NextResponse.redirect(
        new URL('/auth/error?message=Authentication failed', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/error?message=No authorization code received', request.url)
      );
    }

    // Handle the callback and create session
    const session = await handleWhopCallback(code);

    if (!session) {
      return NextResponse.redirect(
        new URL('/auth/error?message=Failed to create session', request.url)
      );
    }

    // Redirect to the app with success
    const redirectUrl = searchParams.get('state') || '/';
    return NextResponse.redirect(new URL(redirectUrl, request.url));

  } catch (error) {
    console.error('Error in Whop callback:', error);
    return NextResponse.redirect(
      new URL('/auth/error?message=Authentication failed', request.url)
    );
  }
}
