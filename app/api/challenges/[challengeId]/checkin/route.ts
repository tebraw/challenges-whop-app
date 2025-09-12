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
            endAt: true,
            experienceId: true
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

    // Check for existing proof based on cadence
    let existingProof = null;
    
    if (enrollment.challenge.cadence === 'END_OF_CHALLENGE') {
      // For END_OF_CHALLENGE, only one proof is allowed throughout the entire challenge
      existingProof = await prisma.proof.findFirst({
        where: {
          enrollmentId: enrollment.id
        }
      });
      
      if (existingProof) {
        return NextResponse.json({ 
          error: 'You have already submitted your proof for this challenge. Only one submission is allowed.' 
        }, { status: 400 });
      }
    } else if (enrollment.challenge.cadence === 'DAILY') {
      // For DAILY cadence, check if already checked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      existingProof = await prisma.proof.findFirst({
        where: {
          enrollmentId: enrollment.id,
          createdAt: {
            gte: today
          }
        }
      });
      
      if (existingProof) {
        return NextResponse.json({ 
          error: 'You have already checked in today. Come back tomorrow!' 
        }, { status: 400 });
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

    // Create new proof
    const proof = await prisma.proof.create({
      data: {
        enrollmentId: enrollment.id,
        type: proofType,
        text: text || null,
        url: imageUrl || linkUrl || null,
        createdAt: new Date(),
        experienceId: enrollment.challenge.experienceId
      }
    });

    // Calculate new stats for check-ins
    const allProofs = await prisma.proof.findMany({
      where: { enrollmentId: enrollment.id },
      orderBy: { createdAt: 'desc' }
    });

    const completedCheckIns = allProofs.length;
    const maxCheckIns = calculateMaxCheckIns(enrollment.challenge);
    const completionRate = maxCheckIns > 0 ? Math.round((completedCheckIns / maxCheckIns) * 100) : 0;

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
        completedCheckIns,
        maxCheckIns,
        completionRate,
        challengeDays: maxCheckIns // For backward compatibility
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

// Helper function to calculate max possible check-ins based on cadence
function calculateMaxCheckIns(challenge: any): number {
  if (challenge.cadence === 'END_OF_CHALLENGE') {
    return 1;
  }
  
  // For DAILY cadence, calculate days between start and end
  const startDate = new Date(challenge.startAt);
  const endDate = new Date(challenge.endAt);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
