import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-experience-id, x-whop-user-token, x-whop-experience-id, x-whop-company-id',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
  }
  
  // Check for Whop app installation context
  const isWhopContext = request.headers.get('x-whop-user-token');
  const experienceId = request.headers.get('x-whop-experience-id');
  const companyId = request.headers.get('x-whop-company-id');
  
  // SMART ONBOARDING: Check subscription before redirecting
  if (isWhopContext && !experienceId && companyId) {
    // This is a company owner installing the app
    console.log('🎯 Company owner detected:', companyId);
    
    // Let them through to main app - auth system will handle subscription check
    // Only redirect to plans if they specifically try to access dashboard creation features
    // The /dashboard page itself should be accessible to show subscription status
    
    if (pathname.startsWith('/dashboard/') && (
        pathname.includes('/new') || 
        pathname.includes('/edit') || 
        pathname.includes('/c/'))) {
      console.log('🔒 Company owner trying to create/edit, checking subscription...');
      
      const url = request.nextUrl.clone();
      url.pathname = '/plans';
      url.searchParams.set('feature_required', 'true');
      url.searchParams.set('company_id', companyId);
      url.searchParams.set('redirect_to', pathname);
      
      console.log('🔄 Redirecting to subscription check:', url.toString());
      return NextResponse.redirect(url);
    }
  }
  
  // Allow dashboard routes to be handled by AdminGuard component instead of middleware
  // The AdminGuard will handle the authentication check properly
  
  // SECURITY: Only allow development auth if explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_AUTH === 'true') {
    const { searchParams } = new URL(request.url);
    const asUser = searchParams.get('as');
    const response = NextResponse.next();
    if (asUser) {
      response.cookies.set('as', asUser, { path: '/' });
    }
    
    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-experience-id, x-whop-user-token, x-whop-experience-id, x-whop-company-id');
    
    return response;
  }
  
  // Create response with CORS headers
  const response = NextResponse.next();
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-experience-id, x-whop-user-token, x-whop-experience-id, x-whop-company-id');
  }
  
  return response;
}

export const config = {
  matcher: [
    // Include API routes explicitly for CORS handling
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
