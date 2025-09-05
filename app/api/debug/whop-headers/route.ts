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
    
    // Specifically check for ALL possible Whop headers
    const whopHeaders = {
      // Standard headers
      'authorization': h.get('authorization'),
      'Authorization': h.get('Authorization'),
      // Experience App headers (lowercase)
      'x-whop-token': h.get('x-whop-token'),
      'x-whop-user-id': h.get('x-whop-user-id'),
      'x-whop-company-id': h.get('x-whop-company-id'),
      'x-whop-membership-id': h.get('x-whop-membership-id'),
      'x-whop-experience-id': h.get('x-whop-experience-id'),
      // Experience App headers (Title Case)
      'X-Whop-Token': h.get('X-Whop-Token'),
      'X-Whop-User-Id': h.get('X-Whop-User-Id'),
      'X-Whop-Company-Id': h.get('X-Whop-Company-Id'),
      'X-Whop-Membership-Id': h.get('X-Whop-Membership-Id'),
      'X-Whop-Experience-Id': h.get('X-Whop-Experience-Id'),
      // Shortened versions
      'x-user-id': h.get('x-user-id'),
      'x-company-id': h.get('x-company-id'),
      'x-membership-id': h.get('x-membership-id'),
      'x-experience-id': h.get('x-experience-id'),
      'X-User-Id': h.get('X-User-Id'),
      'X-Company-Id': h.get('X-Company-Id'),
      'X-Membership-Id': h.get('X-Membership-Id'),
      'X-Experience-Id': h.get('X-Experience-Id'),
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
