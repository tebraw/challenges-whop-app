import { NextRequest, NextResponse } from 'next/server';
import { getExperienceContext } from '@/lib/whop-experience';

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes that don't need auth
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname === '/favicon.ico' ||
    request.nextUrl.pathname.startsWith('/api/debug')
  ) {
    return NextResponse.next();
  }

  try {
    // Get experience context
    const experienceContext = await getExperienceContext();
    
    // If user is accessing via Whop Experience, trigger auto-promotion
    if (experienceContext.userId && experienceContext.companyId) {
      console.log('🎯 Whop Experience detected, triggering auto-promotion...');
      
      // Call auto-promotion API
      try {
        const promotionResponse = await fetch(new URL('/api/auth/auto-promote', request.url), {
          method: 'POST',
          headers: {
            'Cookie': request.headers.get('cookie') || '',
            'x-whop-user-token': request.headers.get('x-whop-user-token') || '',
            'x-whop-user-id': experienceContext.userId,
            'x-whop-company-id': experienceContext.companyId,
            'referer': request.headers.get('referer') || ''
          }
        });
        
        if (promotionResponse.ok) {
          const result = await promotionResponse.json();
          if (result.success) {
            console.log('✅ Auto-promotion successful in middleware');
          }
        }
      } catch (error) {
        console.error('❌ Auto-promotion failed in middleware:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Middleware error:', error);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
