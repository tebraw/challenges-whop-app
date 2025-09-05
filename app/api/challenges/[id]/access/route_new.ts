import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    // Get the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        rules: true,
        startAt: true,
        endAt: true,
        proofType: true,
        cadence: true,
        _count: {
          select: {
            enrollments: true
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

    // For now, grant access to all challenges
    // TODO: Implement actual Whop integration
    const hasAccess = true;

    if (hasAccess) {
      return NextResponse.json({
        hasAccess: true,
        message: 'Access granted'
      });
    }

    // Return preview for non-members
    const challengeRules = challenge.rules as any;
    const preview = {
      title: challenge.title,
      description: challenge.description,
      duration: Math.ceil(
        (new Date(challenge.endAt).getTime() - new Date(challenge.startAt).getTime()) 
        / (1000 * 60 * 60 * 24)
      ),
      participantCount: challenge._count?.enrollments || 0,
      imageUrl: challenge.imageUrl || challengeRules?.imageUrl,
      rewards: challengeRules?.rewards || [],
      requiresMembership: false,
      communityName: 'Community',
      creatorName: 'Creator'
    };

    return NextResponse.json({
      hasAccess: false,
      preview
    });

  } catch (error) {
    console.error('Error checking challenge access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}