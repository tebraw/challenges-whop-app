import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ experienceId: string }> }
) {
  try {
    const { experienceId } = await context.params;
    
    // Development mode detection
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Return mock challenges for development
      const mockChallenges = [
        {
          id: 'challenge-1',
          title: 'Täglich 10k Schritte',
          description: 'Gehe jeden Tag mindestens 10.000 Schritte',
          startAt: new Date('2025-09-01'),
          endAt: new Date('2025-09-30'),
          isActive: true,
          participants: [],
          _count: { participants: 5 }
        },
        {
          id: 'challenge-2', 
          title: 'Wöchentlich 3x Sport',
          description: 'Trainiere mindestens 3x pro Woche',
          startAt: new Date('2025-09-01'),
          endAt: new Date('2025-09-30'),
          isActive: true,
          participants: [],
          _count: { participants: 12 }
        }
      ];
      
      return NextResponse.json({ challenges: mockChallenges });
    }

    // Production: Get challenges from database
    const challenges = await prisma.challenge.findMany({
      where: { experienceId },
      include: {
        participants: true,
        _count: {
          select: { participants: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Challenges GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ experienceId: string }> }
) {
  try {
    const { experienceId } = await context.params;
    const body = await request.json();
    
    // Development mode
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Return mock created challenge
      const mockChallenge = {
        id: `challenge-${Date.now()}`,
        ...body,
        experienceId,
        createdById: 'dev_user_123',
        isActive: true,
        createdAt: new Date()
      };
      
      return NextResponse.json({ challenge: mockChallenge });
    }

    // Production: Get auth token and verify admin access
    const headersList = request.headers;
    const authToken = headersList.get('authorization')?.replace('Bearer ', '');
    
    if (!authToken) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const userData = await whopSdk.verifyUserToken(authToken);
    if (!userData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Create new challenge
    const challenge = await prisma.challenge.create({
      data: {
        ...body,
        experienceId,
        createdById: userData.userId,
        isActive: true
      }
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Challenges POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}