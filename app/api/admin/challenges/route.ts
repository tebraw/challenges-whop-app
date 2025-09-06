// app/api/admin/challenges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    await requireAdmin();
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      imageUrl,
      whopCategoryName,
      startAt,
      endAt,
      proofType,
      cadence,
      rules
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Development mode - return mock response
    if (process.env.NODE_ENV === 'development') {
      const mockChallenge = {
        id: `challenge-${Date.now()}`,
        title,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop',
        whopCategoryName: whopCategoryName || 'General',
        startAt: startAt ? new Date(startAt) : new Date(),
        endAt: endAt ? new Date(endAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        proofType: proofType || 'PHOTO',
        cadence: cadence || 'DAILY',
        rules: rules || {
          minParticipants: 1,
          maxParticipants: 100,
          dailyCheckIn: true
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: currentUser.id // Using user ID as tenant for now
      };

      console.log('✅ Mock challenge created:', mockChallenge.title);
      return NextResponse.json({ 
        success: true,
        challenge: mockChallenge,
        message: 'Challenge created successfully (development mode)'
      });
    }

    // Production mode - create in database
    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        imageUrl,
        whopCategoryName: whopCategoryName || 'General',
        startAt: startAt ? new Date(startAt) : new Date(),
        endAt: endAt ? new Date(endAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        proofType: proofType || 'PHOTO',
        cadence: cadence || 'DAILY',
        rules: rules || {
          minParticipants: 1,
          maxParticipants: 100,
          dailyCheckIn: true
        },
        tenantId: currentUser.id, // Using user ID as tenant for now
        creatorId: currentUser.id
      }
    });

    console.log('✅ Challenge created in database:', challenge.title);
    return NextResponse.json({ 
      success: true,
      challenge,
      message: 'Challenge created successfully'
    });

  } catch (error: any) {
    console.error('❌ Challenge creation error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A challenge with this title already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create challenge',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await requireAdmin();
    
    // Development mode - return mock challenges
    if (process.env.NODE_ENV === 'development') {
      const mockChallenges = [
        {
          id: 'cmf7lrtlq000314ehs17u67jy',
          title: '30-Day Fitness Challenge',
          description: 'Transform your fitness in 30 days',
          imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop',
          whopCategoryName: 'Fitness',
          startAt: new Date('2025-09-01'),
          endAt: new Date('2025-09-30'),
          proofType: 'PHOTO',
          cadence: 'DAILY',
          createdAt: new Date(),
          _count: { enrollments: 42 }
        }
      ];

      return NextResponse.json({ challenges: mockChallenges });
    }

    // Production mode - fetch from database
    const challenges = await prisma.challenge.findMany({
      include: {
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ challenges });

  } catch (error: any) {
    console.error('❌ Error fetching admin challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}
