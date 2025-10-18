/**
 * 🚀 CHALLENGE IMAGE API
 * GET /api/challenges/[challengeId]/image
 * 
 * Loads single challenge image to avoid 10MiB Response Size limit in main queries
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;

    // Load only the image for this challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { 
        imageUrl: true,
        id: true,
        title: true // For logging
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    console.log('📸 Loading image for challenge:', { 
      id: challenge.id, 
      title: challenge.title,
      hasImage: !!challenge.imageUrl 
    });

    return NextResponse.json({
      success: true,
      challengeId: challenge.id,
      imageUrl: challenge.imageUrl || null
    });

  } catch (error) {
    console.error('Challenge image API error:', error);
    return NextResponse.json(
      { error: 'Failed to load challenge image' },
      { status: 500 }
    );
  }
}