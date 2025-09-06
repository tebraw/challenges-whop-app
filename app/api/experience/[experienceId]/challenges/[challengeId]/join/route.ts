import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk';
import { headers } from 'next/headers';

// POST /api/experience/[experienceId]/challenges/[challengeId]/join
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ experienceId: string; challengeId: string }> }
) {
  try {
    const { experienceId, challengeId } = await params;
    const headersList = await headers();
    const { userId } = await whopSdk.verifyUserToken(headersList);
    
    const accessCheck = await whopSdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId,
    });

    if (accessCheck.accessLevel === 'no_access') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { whopUserId: userId }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if challenge exists and user has access
    const challenge = await prisma.challenge.findFirst({
      where: {
        id: challengeId,
        tenant: {
          whopCompanyId: dbUser.whopCompanyId
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: dbUser.id,
        challengeId: challenge.id
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 400 });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: dbUser.id,
        challengeId: challenge.id
      }
    });

    return NextResponse.json({ 
      success: true, 
      enrollment: {
        id: enrollment.id,
        challengeId: enrollment.challengeId,
        joinedAt: enrollment.joinedAt
      }
    });

  } catch (error) {
    console.error('Error joining challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
