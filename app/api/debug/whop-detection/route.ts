// app/api/debug/whop-detection/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const h = await headers();
    
    // Get all possible headers
    const allHeaders: Record<string, string> = {};
    h.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    // Analyze context
    const referer = h.get('referer') || '';
    const userAgent = h.get('user-agent') || '';
    const host = h.get('host') || '';
    
    // Check for Whop headers
    const whopHeaders = [
      'x-whop-token', 'x-whop-user-id', 'x-whop-company-id',
      'X-Whop-Token', 'X-Whop-User-Id', 'X-Whop-Company-Id',
      'x-user-id', 'x-company-id', 'authorization'
    ];
    
    const foundWhopHeaders = whopHeaders.filter(header => h.get(header));
    
    // Determine access method
    let accessMethod = 'unknown';
    let recommendation = '';
    
    if (referer.includes('whop.com')) {
      if (foundWhopHeaders.length > 0) {
        accessMethod = 'whop-experience-with-headers';
        recommendation = '✅ Perfect! You are accessing via Whop Experience with headers.';
      } else {
        accessMethod = 'whop-experience-no-headers';
        recommendation = '⚠️ Accessing via Whop but no headers found. Check app configuration.';
      }
    } else if (host.includes('whop.com')) {
      accessMethod = 'whop-domain-direct';
      recommendation = '🔄 On Whop domain but no referrer. Try navigating from company page.';
    } else {
      accessMethod = 'direct-url';
      recommendation = '❌ Direct URL access. Use Experience URL or OAuth login instead.';
    }
    
    const result = {
      timestamp: new Date().toISOString(),
      analysis: {
        accessMethod,
        recommendation,
        hasWhopHeaders: foundWhopHeaders.length > 0,
        foundHeaders: foundWhopHeaders,
        isWhopReferrer: referer.includes('whop.com'),
        isWhopDomain: host.includes('whop.com')
      },
      context: {
        referer,
        userAgent: userAgent.slice(0, 100),
        host
      },
      nextSteps: getNextSteps(accessMethod, foundWhopHeaders.length > 0)
    };
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      error: 'Detection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getNextSteps(accessMethod: string, hasHeaders: boolean): string[] {
  switch (accessMethod) {
    case 'whop-experience-with-headers':
      return [
        '✅ Authentication should work',
        'Test "Experience Auth" button',
        'If still issues, check app permissions'
      ];
      
    case 'whop-experience-no-headers':
      return [
        '🔧 Check app configuration in dev.whop.com',
        'Ensure app has user:read permissions',
        'Verify app is properly installed'
      ];
      
    case 'direct-url':
      return [
        '🖼️ Use Experience URL: whop.com/company/[ID]/experiences/[APP]',
        '🔐 Or try OAuth login button below',
        '📋 Check installation in developer portal'
      ];
      
    default:
      return [
        '🔍 Check app installation status',
        '📞 Contact support if issues persist',
        '🧪 Try alternative authentication methods'
      ];
  }
}
