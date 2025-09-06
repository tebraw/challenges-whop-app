import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow admin routes to be handled by AdminGuard component instead of middleware
  // The AdminGuard will handle the authentication check properly
  
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};