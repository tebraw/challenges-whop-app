// MIDDLEWARE UPDATE: Automatic Company ID Extraction
// This replaces the fallback logic with real company ID detection

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
  
  // 🎯 AUTOMATIC COMPANY ID EXTRACTION
  const isWhopContext = request.headers.get('x-whop-user-token');
  const experienceId = request.headers.get('x-whop-experience-id');
  const headerCompanyId = request.headers.get('x-whop-company-id');
  
  if (isWhopContext) {
    console.log('🔍 Whop context detected - extracting real company ID...');
    console.log(`   Experience ID: ${experienceId || 'NONE'}`);
    console.log(`   Header Company ID: ${headerCompanyId || 'NONE'}`);
    
    // Extract real company ID
    let realCompanyId = null;
    
    if (!experienceId && headerCompanyId) {
      // Company Owner case
      realCompanyId = headerCompanyId;
      console.log(`👑 Company Owner detected: ${realCompanyId}`);
    } else if (experienceId) {
      // Experience Member case - extract from experience ID
      const experienceCode = experienceId.replace('exp_', '');
      realCompanyId = `biz_${experienceCode}`;
      console.log(`👤 Experience Member detected: ${realCompanyId} (from ${experienceId})`);
    }
    
    if (realCompanyId) {
      console.log(`✅ Real Company ID: ${realCompanyId}`);
      
      // Set up automatic user creation/update in next request
      const response = NextResponse.next();
      response.headers.set('x-real-company-id', realCompanyId);
      response.headers.set('x-is-company-owner', (!experienceId && headerCompanyId) ? 'true' : 'false');
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-experience-id, x-whop-user-token, x-whop-experience-id, x-whop-company-id, x-real-company-id, x-is-company-owner');
      
      return response;
    } else {
      console.log('⚠️ Could not determine real company ID!');
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