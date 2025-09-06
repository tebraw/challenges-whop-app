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
      // Return mock challenges for customer view
      const mockChallenges = [
        {
          id: 'challenge-1',
          title: 'Täglich 10k Schritte',
          description: 'Gehe jeden Tag mindestens 10.000 Schritte',
          startAt: new Date('2025-09-01'),
          endAt: new Date('2025-09-30'),
          isActive: true,
          isParticipating: false,
          _count: { participants: 5 }
        },
        {
          id: 'challenge-2', 
          title: 'Wöchentlich 3x Sport',
          description: 'Trainiere mindestens 3x pro Woche',
          startAt: new Date('2025-09-01'),
          endAt: new Date('2025-09-30'),
          isActive: true,
          isParticipating: true,
          _count: { participants: 12 }
        }
      ];
      
      return NextResponse.json({ challenges: mockChallenges });
    }

    // Production code...
    const headersList = request.headers;
    const authToken = headersList.get('authorization')?.replace('Bearer ', '');
    
    if (!authToken) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const userData = await whopSdk.verifyUserToken(authToken);
    if (!userData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // This will need to be fixed when Prisma schema is corrected
    const challenges: any[] = []; // Placeholder with explicit type

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Customer GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
