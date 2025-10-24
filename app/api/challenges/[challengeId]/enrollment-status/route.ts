/**
 * 🎯 ENROLLMENT STATUS POLLING ENDPOINT
 * 
 * After payment via inline modal, client polls this endpoint to check if enrollment
 * has been created by the payment.succeeded webhook
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopAppSdk } from '@/lib/whop-sdk-unified';

export async function GET(
  request: NextRequest,
  { params }: { params: { challengeId: string } }
) {
  try {
    const challengeId = params.challengeId;
    
    // Get headers for Whop authentication
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    
    if (!whopUserToken) {
      return NextResponse.json({ 
        error: 'Unauthorized - No Whop token',
        enrolled: false 
      }, { status: 401 });
    }

    // Verify user with Whop SDK
    const { userId } = await whopAppSdk.verifyUserToken(headersList);
    
    // Find user in our database
    const user = await prisma.user.findUnique({
      where: { whopUserId: userId }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        enrolled: false 
      }, { status: 404 });
    }

    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        challengeId
      }
    });

    if (enrollment) {
      return NextResponse.json({
        enrolled: true,
        enrollmentId: enrollment.id
      });
    }

    return NextResponse.json({
      enrolled: false
    });

  } catch (error) {
    console.error('Enrollment status check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check enrollment status',
      enrolled: false
    }, { status: 500 });
  }
}
