// app/api/debug/headers/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const h = await headers();
    
    // Convert headers to object for easier inspection
    const allHeaders: Record<string, string> = {};
    for (const [key, value] of h.entries()) {
      allHeaders[key] = value;
    }
    
    // Extract potential Whop-related headers
    const whopHeaders = Object.entries(allHeaders)
      .filter(([key]) => 
        key.toLowerCase().includes('whop') ||
        key.toLowerCase().includes('user') ||
        key.toLowerCase().includes('company') ||
        key.toLowerCase().includes('experience') ||
        key.toLowerCase().includes('membership') ||
        key.toLowerCase().includes('x-') ||
        key.toLowerCase().includes('referer') ||
        key.toLowerCase().includes('origin') ||
        key.toLowerCase().includes('authorization')
      )
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      whopHeaders,
      allHeaderCount: Object.keys(allHeaders).length,
      whopHeaderCount: Object.keys(whopHeaders).length,
      // Include some common headers for debugging
      commonHeaders: {
        userAgent: allHeaders['user-agent'],
        referer: allHeaders['referer'],
        origin: allHeaders['origin'],
        host: allHeaders['host'],
        'x-forwarded-for': allHeaders['x-forwarded-for'],
        'x-real-ip': allHeaders['x-real-ip']
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to read headers',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
