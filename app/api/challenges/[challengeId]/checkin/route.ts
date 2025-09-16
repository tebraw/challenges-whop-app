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

    // Check for existing proof based on cadence - UPDATE instead of BLOCK
    let existingProof = null;
    let isUpdate = false;
    
    if (enrollment.challenge.cadence === 'END_OF_CHALLENGE') {
      // For END_OF_CHALLENGE, allow replacing the proof anytime during challenge
      existingProof = await prisma.proof.findFirst({
        where: {
          enrollmentId: enrollment.id,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (existingProof) {
        isUpdate = true;
        console.log('Found existing END_OF_CHALLENGE proof for update:', existingProof.id);
      }
    } else if (enrollment.challenge.cadence === 'DAILY') {
      // For DAILY cadence, allow replacing proof on the same day
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      
      existingProof = await prisma.proof.findFirst({
        where: {
          enrollmentId: enrollment.id,
          isActive: true,
          createdAt: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (existingProof) {
        isUpdate = true;
        console.log('Found existing DAILY proof for update:', existingProof.id);
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

    // Create or update proof
    let proof;
    if (isUpdate && existingProof) {
      // Update existing proof
      console.log('Updating existing proof:', existingProof.id);
      proof = await prisma.proof.update({
        where: { id: existingProof.id },
        data: {
          type: proofType,
          text: text || null,
          url: imageUrl || linkUrl || null,
          updatedAt: new Date(),
          version: existingProof.version + 1
        }
      });
      console.log('Proof updated successfully:', proof.id);
    } else {
      // Create new proof
      console.log('Creating new proof for enrollment:', enrollment.id);
      proof = await prisma.proof.create({
        data: {
          experienceId: enrollment.challenge.experienceId,
          enrollmentId: enrollment.id,
          type: proofType,
          text: text || null,
          url: imageUrl || linkUrl || null,
          createdAt: new Date(),
          version: 1
        }
      });
      console.log('New proof created:', proof.id);
    }

    // Calculate new stats for check-ins
    const allProofs = await prisma.proof.findMany({
      where: { 
        enrollmentId: enrollment.id,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const completedCheckIns = allProofs.length;
    const maxCheckIns = calculateMaxCheckIns(enrollment.challenge);
    const completionRate = maxCheckIns > 0 ? Math.round((completedCheckIns / maxCheckIns) * 100) : 0;

    const responseMessage = isUpdate ? 
      'Existing check-in will be replaced' : 
      'Check-in successful!';

    console.log('Check-in completed:', {
      isUpdate,
      proofId: proof.id,
      completedCheckIns,
      maxCheckIns,
      completionRate
    });

    return NextResponse.json({
      success: true,
      message: responseMessage,
      checkin: {
        id: proof.id,
        createdAt: proof.createdAt,
        updatedAt: proof.updatedAt,
        text: proof.text,
        imageUrl: proof.url,
        linkUrl: proof.url,
        isUpdate: isUpdate,
        version: proof.version
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

// PUT handler for updating existing proofs
export async function PUT(
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
    const { text, imageUrl, linkUrl, proofId } = body;

    if (!proofId) {
      return NextResponse.json({ error: 'Proof ID is required for updates' }, { status: 400 });
    }

    // Find the existing proof and verify ownership
    const existingProof = await prisma.proof.findFirst({
      where: {
        id: proofId,
        enrollment: {
          challengeId: challengeId,
          userId: user.id
        }
      },
      include: {
        enrollment: {
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
            }
          }
        }
      }
    });

    if (!existingProof) {
      return NextResponse.json({ error: 'Proof not found or access denied' }, { status: 404 });
    }

    // Check if we can still edit this proof (only same day for DAILY challenges)
    if (existingProof.enrollment.challenge.cadence === 'DAILY') {
      const proofDate = new Date(existingProof.createdAt);
      const today = new Date();
      const isSameDay = proofDate.toDateString() === today.toDateString();
      
      if (!isSameDay) {
        return NextResponse.json({ 
          error: 'Cannot edit proofs from previous days' 
        }, { status: 400 });
      }
    }

    // Validate proof type
    const { proofType } = existingProof.enrollment.challenge;
    if (proofType === 'TEXT' && !text) {
      return NextResponse.json({ error: 'Text proof is required' }, { status: 400 });
    }
    if (proofType === 'PHOTO' && !imageUrl) {
      return NextResponse.json({ error: 'Photo proof is required' }, { status: 400 });
    }
    if (proofType === 'LINK' && !linkUrl) {
      return NextResponse.json({ error: 'Link proof is required' }, { status: 400 });
    }

    // Update the proof
    const updatedProof = await prisma.proof.update({
      where: { id: proofId },
      data: {
        type: proofType,
        text: text || null,
        url: imageUrl || linkUrl || null,
        updatedAt: new Date(),
        version: existingProof.version + 1
      }
    });

    console.log('Proof updated via PUT:', updatedProof.id);

    return NextResponse.json({
      success: true,
      message: 'Proof updated successfully!',
      checkin: {
        id: updatedProof.id,
        createdAt: updatedProof.createdAt,
        updatedAt: updatedProof.updatedAt,
        text: updatedProof.text,
        imageUrl: updatedProof.url,
        linkUrl: updatedProof.url,
        isUpdate: true,
        version: updatedProof.version
      }
    });

  } catch (error) {
    console.error('Error updating proof:', error);
    return NextResponse.json(
      { error: 'Failed to update proof' },
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
