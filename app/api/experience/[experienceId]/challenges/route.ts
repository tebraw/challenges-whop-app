import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ experienceId: string }> }
) {
  try {
    const { experienceId } = await context.params;
    
    // 🔒 SECURITY: Require authentication for all challenge access
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Development mode detection
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Return mock challenges for development (still require auth)
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

    // 🔒 SECURITY: Only show public challenges for community members
    // Admin users can see all challenges from their tenant
    let whereClause: any = {
      isPublic: true // Community members only see public challenges
    };
    
    if (user.role === 'ADMIN' && user.tenantId) {
      // Admins can see all challenges from their tenant
      whereClause = {
        tenantId: user.tenantId
      };
    }

    // Production: Get challenges from database with proper filtering
    const challenges = await prisma.challenge.findMany({
      where: whereClause,
      include: {
        enrollments: true,
        _count: {
          select: { enrollments: true }
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
    // 🔒 SECURITY: Only admins can create challenges
    await requireAdmin();
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // 🔒 SECURITY: Double-check admin role
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Only company owners can create challenges.' 
      }, { status: 403 });
    }
    
    const { experienceId } = await context.params;
    const body = await request.json();
    
    // Development mode
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Return mock created challenge (still require admin)
      const mockChallenge = {
        id: `challenge-${Date.now()}`,
        ...body,
        experienceId,
        createdById: user.id,
        isActive: true,
        createdAt: new Date()
      };
      
      return NextResponse.json({ challenge: mockChallenge });
    }

    // Production: Create new challenge with proper tenant isolation
    const challenge = await prisma.challenge.create({
      data: {
        ...body,
        tenantId: user.tenantId,
        creatorId: user.id,
        isActive: true
      }
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Challenges POST error:', error);
    
    // Handle specific admin access errors
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Access denied. Only company owners can create challenges.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}