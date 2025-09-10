// app/api/debug/experience-context/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers, cookies } from 'next/headers';
import { getExperienceContext } from '@/lib/whop-experience';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const h = await headers();
    const c = await cookies();
    
    // Get all relevant headers
    const allHeaders: Record<string, string> = {};
    h.forEach((value, key) => {
      if (key.toLowerCase().includes('whop') || 
          key.toLowerCase().includes('user') || 
          key.toLowerCase().includes('company') ||
          key.toLowerCase().includes('experience')) {
        allHeaders[key] = value;
      }
    });
    
    // Get all relevant cookies
    const allCookies: Record<string, string> = {};
    c.getAll().forEach(cookie => {
      if (cookie.name.toLowerCase().includes('whop') || 
          cookie.name.toLowerCase().includes('user') || 
          cookie.name.toLowerCase().includes('experience')) {
        allCookies[cookie.name] = cookie.value;
      }
    });
    
    // Get Experience context
    const experienceContext = await getExperienceContext();
    
    // Get current user
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch (error) {
      console.log('Current user fetch failed:', error);
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        WHOP_EXPERIENCE_ID: process.env.WHOP_EXPERIENCE_ID || 'Not set',
        NEXT_PUBLIC_WHOP_EXPERIENCE_ID: process.env.NEXT_PUBLIC_WHOP_EXPERIENCE_ID || 'Not set',
        NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'Not set'
      },
      headers: allHeaders,
      cookies: allCookies,
      experienceContext,
      currentUser: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        whopUserId: currentUser.whopUserId,
        whopCompanyId: currentUser.whopCompanyId
      } : null,
      analysis: {
        isInWhopIframe: !!experienceContext.userId && experienceContext.isEmbedded,
        hasWhopHeaders: Object.keys(allHeaders).length > 0,
        hasWhopCookies: Object.keys(allCookies).length > 0,
        userAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'ADMIN'
      }
    };
    
    return NextResponse.json(debugInfo, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
