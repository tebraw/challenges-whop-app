import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // SECURITY: Block admin routes in production without proper auth
  if (pathname.startsWith('/admin')) {
    // In production, redirect to Whop OAuth if no session
    if (process.env.NODE_ENV === 'production') {
      const whopSession = request.cookies.get('whop_session');
      if (!whopSession) {
        return NextResponse.redirect(new URL('/api/auth/whop/login', request.url));
      }
    }
  }
  
  // SECURITY: Block direct access to admin APIs in production
  if (pathname.startsWith('/api/admin')) {
    if (process.env.NODE_ENV === 'production') {
      const whopSession = request.cookies.get('whop_session');
      if (!whopSession) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
  }
  
  // SECURITY: Only allow development auth if explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_AUTH === 'true') {
    const { searchParams } = new URL(request.url);
    const asUser = searchParams.get('as');
    const response = NextResponse.next();
    if (asUser) {
      response.cookies.set('as', asUser, { path: '/' });
    }
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};