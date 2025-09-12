// api/debug/app-health/route.ts - Health check endpoint for Whop app
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    
    // Extract all Whop-related headers
    const whopHeaders = {
      userToken: headersList.get('x-whop-user-token'),
      userId: headersList.get('x-whop-user-id'),
      experienceId: headersList.get('x-whop-experience-id') || headersList.get('x-experience-id'),
      companyId: headersList.get('x-whop-company-id') || headersList.get('x-company-id'),
      userAgent: headersList.get('user-agent'),
      origin: headersList.get('origin'),
      referer: headersList.get('referer'),
      host: headersList.get('host')
    };
    
    // Check environment variables
    const envCheck = {
      hasWhopApiKey: !!process.env.WHOP_API_KEY && process.env.WHOP_API_KEY !== 'fallback',
      hasAppId: !!process.env.NEXT_PUBLIC_WHOP_APP_ID && process.env.NEXT_PUBLIC_WHOP_APP_ID !== 'fallback',
      hasAgentUserId: !!process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
      hasCompanyId: !!process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      appUrl: process.env.WHOP_APP_URL || 'NOT_SET',
      nodeEnv: process.env.NODE_ENV
    };
    
    // Determine request context
    const context = {
      isWhopRequest: !!(whopHeaders.userToken || whopHeaders.experienceId || whopHeaders.companyId),
      isCompanyOwner: !!(whopHeaders.companyId && !whopHeaders.experienceId),
      isExperienceMember: !!(whopHeaders.experienceId),
      isLocalhost: whopHeaders.host?.includes('localhost'),
      isProduction: process.env.NODE_ENV === 'production'
    };
    
    // Health status
    const status = {
      healthy: envCheck.hasWhopApiKey && envCheck.hasAppId && (envCheck.appUrl !== 'NOT_SET'),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return NextResponse.json({
      status,
      whopHeaders,
      envCheck,
      context,
      troubleshooting: {
        commonIssues: [
          !envCheck.hasWhopApiKey && 'WHOP_API_KEY missing or set to fallback',
          !envCheck.hasAppId && 'NEXT_PUBLIC_WHOP_APP_ID missing or set to fallback',
          envCheck.appUrl === 'NOT_SET' && 'WHOP_APP_URL not configured',
          !context.isWhopRequest && 'No Whop headers detected - may not be in Whop iframe'
        ].filter(Boolean)
      }
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({
      status: { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}