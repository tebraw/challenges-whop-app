import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopSdk, whopAppSdk } from '@/lib/whop-sdk-unified';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    // Get headers for Whop authentication (same as Experience pages)
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    
    if (!whopUserToken) {
      return NextResponse.json({ error: 'Unauthorized - No Whop token' }, { status: 401 });
    }

    // Verify user with Whop SDK (same method as Experience pages)
    const { userId } = await whopAppSdk.verifyUserToken(headersList);
    
    // Find user in our database
    const user = await prisma.user.findUnique({
      where: { whopUserId: userId },
      include: { tenant: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const { challengeId } = await params;

    // Check if challenge exists and is active
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        experienceId: true,
        _count: {
          select: { enrollments: true }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if challenge has not ended
    const now = new Date();
    const endDate = new Date(challenge.endAt);

    if (now > endDate) {
      return NextResponse.json({ error: 'Challenge has already ended' }, { status: 400 });
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challengeId,
          userId: user.id
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this challenge' }, { status: 400 });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        challengeId: challengeId,
        experienceId: challenge.experienceId,
        joinedAt: new Date()
      },
      include: {
        challenge: {
          select: {
            title: true,
            startAt: true,
            endAt: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully joined "${challenge.title}"!`,
      enrollment: {
        id: enrollment.id,
        joinedAt: enrollment.joinedAt,
        challenge: enrollment.challenge
      }
    });

  } catch (error) {
    console.error('Error joining challenge:', error);
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    );
  }
}
