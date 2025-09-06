import { NextRequest, NextResponse } from 'next/server';
import { headers, cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Testing Token Analysis...');
    
    // Get headers and cookies
    const headersList = await headers();
    const cookieStore = await cookies();
    
    // Check all possible token sources
    const whopUserTokenHeader = headersList.get('x-whop-user-token');
    const whopUserTokenCookie = cookieStore.get('whop_user_token')?.value;
    const appConfigCookie = cookieStore.get('whop.app-config')?.value;
    
    console.log('Token Header:', whopUserTokenHeader ? 'Found' : 'Not found');
    console.log('Token Cookie:', whopUserTokenCookie ? 'Found' : 'Not found');
    console.log('App Config:', appConfigCookie ? 'Found' : 'Not found');
    
    let tokenPayload = null;
    let appConfigPayload = null;
    
    // Try to parse user token
    if (whopUserTokenHeader || whopUserTokenCookie) {
      const token = whopUserTokenHeader || whopUserTokenCookie;
      try {
        const payload = JSON.parse(atob(token!.split('.')[1]));
        tokenPayload = payload;
        console.log('✅ Token parsed successfully:', payload);
      } catch (error) {
        console.log('❌ Failed to parse token:', error);
      }
    }
    
    // Try to parse app config
    if (appConfigCookie) {
      try {
        const payload = JSON.parse(atob(appConfigCookie.split('.')[1]));
        appConfigPayload = payload;
        console.log('✅ App config parsed successfully:', payload);
      } catch (error) {
        console.log('❌ Failed to parse app config:', error);
      }
    }
    
    // Now try with Whop SDK
    let whopSdkResult = null;
    try {
      const { whopSdk } = await import('@/lib/whop-sdk');
      const result = await whopSdk.verifyUserToken(headersList);
      whopSdkResult = result;
      console.log('✅ Whop SDK verification successful:', result);
    } catch (error: any) {
      console.log('❌ Whop SDK verification failed:', error?.message);
      whopSdkResult = { error: error?.message || 'Unknown error' };
    }
    
    return NextResponse.json({
      success: true,
      analysis: {
        tokenSources: {
          header: whopUserTokenHeader ? 'Found' : 'Not found',
          cookie: whopUserTokenCookie ? 'Found' : 'Not found',
          appConfig: appConfigCookie ? 'Found' : 'Not found'
        },
        tokenPayload,
        appConfigPayload,
        whopSdkResult
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Token test failed:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });
  }
}
