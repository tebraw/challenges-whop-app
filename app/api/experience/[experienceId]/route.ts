import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ experienceId: string }> }
) {
  try {
    const { experienceId } = await context.params;
    
    // Get auth token from headers
    const headersList = request.headers;
    const authToken = headersList.get('authorization')?.replace('Bearer ', '');
    
    if (!authToken) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    // Verify user with Whop
    const userData = await whopSdk.verifyUserToken(authToken);
    if (!userData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // For now, return basic experience data
    return NextResponse.json({
      experienceId,
      user: userData,
      status: 'success'
    });
  } catch (error) {
    console.error('Experience API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
