// app/api/debug/whop-headers/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const h = await headers();
    
    // Log all headers for debugging
    const allHeaders: Record<string, string> = {};
    h.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    // Specifically check for Whop headers
    const whopHeaders = {
      'authorization': h.get('authorization'),
      'x-whop-token': h.get('x-whop-token'),
      'x-whop-user-id': h.get('x-whop-user-id'),
      'x-whop-company-id': h.get('x-whop-company-id'),
      'x-whop-membership-id': h.get('x-whop-membership-id'),
      'x-whop-experience-id': h.get('x-whop-experience-id'),
    };
    
    return NextResponse.json({
      status: 'debug',
      whopHeaders,
      allHeaders,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to read headers',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
