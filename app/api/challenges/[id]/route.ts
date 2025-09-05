import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { enrollments: true }
        },
        enrollments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            checkins: true,
            proofs: true
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // SICHERHEIT: Nur Admins können Challenges bearbeiten
    await requireAdmin();
    
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        proofType: body.proofType || 'TEXT',
        imageUrl: body.imageUrl || body.rules?.imageUrl || '', // Prefer top-level imageUrl
        rules: {
          cadence: body.rules?.cadence || body.cadence || 'DAILY',
          maxParticipants: body.rules?.maxParticipants || body.maxParticipants || null,
          rewards: body.rules?.rewards || body.rewards || [],
          policy: body.rules?.policy || body.policy || '',
          imageUrl: body.imageUrl || body.rules?.imageUrl || '',
          difficulty: body.rules?.difficulty || body.difficulty || 'BEGINNER'
        }
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    });

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // SICHERHEIT: Nur Admins können Challenges löschen
    await requireAdmin();
    
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // First check if challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: { id: true, title: true }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Delete all related data in the correct order to avoid foreign key constraints
    // 1. Delete proofs first
    await prisma.proof.deleteMany({
      where: {
        enrollment: {
          challengeId: id
        }
      }
    });

    // 2. Delete checkins
    await prisma.checkin.deleteMany({
      where: {
        enrollment: {
          challengeId: id
        }
      }
    });

    // 3. Delete enrollments
    await prisma.enrollment.deleteMany({
      where: { challengeId: id }
    });

    // 4. Finally delete the challenge itself
    await prisma.challenge.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Challenge deleted successfully',
      deletedChallenge: challenge
    });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to delete challenge' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
