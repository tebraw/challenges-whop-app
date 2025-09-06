import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = await params;
    const body = await req.json();
    const { text, imageUrl, linkUrl } = body;

    // Check if user is enrolled in this challenge
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challengeId,
          userId: user.id
        }
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            proofType: true,
            cadence: true,
            startAt: true,
            endAt: true
          }
        },
        proofs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this challenge' }, { status: 400 });
    }

    // Check if challenge is active
    const now = new Date();
    const startDate = new Date(enrollment.challenge.startAt);
    const endDate = new Date(enrollment.challenge.endAt);

    if (now < startDate) {
      return NextResponse.json({ error: 'Challenge has not started yet' }, { status: 400 });
    }

    if (now > endDate) {
      return NextResponse.json({ error: 'Challenge has ended' }, { status: 400 });
    }

    // Check if already checked in today (for DAILY cadence)
    if (enrollment.challenge.cadence === 'DAILY') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayProof = await prisma.proof.findFirst({
        where: {
          enrollmentId: enrollment.id,
          createdAt: {
            gte: today
          }
        }
      });

      if (todayProof) {
        return NextResponse.json({ error: 'Already checked in today' }, { status: 400 });
      }
    }

    // Validate proof type
    const { proofType } = enrollment.challenge;
    if (proofType === 'TEXT' && !text) {
      return NextResponse.json({ error: 'Text proof is required' }, { status: 400 });
    }
    if (proofType === 'PHOTO' && !imageUrl) {
      return NextResponse.json({ error: 'Photo proof is required' }, { status: 400 });
    }
    if (proofType === 'LINK' && !linkUrl) {
      return NextResponse.json({ error: 'Link proof is required' }, { status: 400 });
    }

    // Create proof (check-in)
    const proof = await prisma.proof.create({
      data: {
        enrollmentId: enrollment.id,
        type: proofType,
        text: text || null,
        url: imageUrl || linkUrl || null,
        createdAt: new Date()
      }
    });

    // Calculate streak and total check-ins
    const allProofs = await prisma.proof.findMany({
      where: { enrollmentId: enrollment.id },
      orderBy: { createdAt: 'desc' }
    });

    const currentStreak = calculateStreak(allProofs);
    const totalCheckIns = allProofs.length;

    return NextResponse.json({
      success: true,
      message: 'Check-in successful!',
      checkin: {
        id: proof.id,
        createdAt: proof.createdAt,
        text: proof.text,
        imageUrl: proof.url,
        linkUrl: proof.url
      },
      stats: {
        currentStreak,
        totalCheckIns,
        challengeDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error) {
    console.error('Error creating check-in:', error);
    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    );
  }
}

// Helper function to calculate current streak
function calculateStreak(checkins: any[]): number {
  if (checkins.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  for (let i = 0; i < checkins.length; i++) {
    const checkinDate = new Date(checkins[i].createdAt);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);
    
    // Check if checkin is on the expected day
    const checkinDay = new Date(checkinDate);
    checkinDay.setHours(0, 0, 0, 0);
    
    if (checkinDay.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
