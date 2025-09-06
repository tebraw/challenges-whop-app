import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ experienceId: string }> }
) {
  try {
    const { experienceId } = await context.params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Development mode - return mock customer challenges
    if (process.env.NODE_ENV === 'development') {
      const mockChallenges = [
        {
          id: 'cmf7lrtlq000314ehs17u67jy',
          title: '30-Day Fitness Challenge',
          description: 'Transform your fitness in 30 days',
          imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop',
          category: 'Fitness',
          startAt: new Date('2025-09-01'),
          endAt: new Date('2025-09-30'),
          isActive: true,
          proofType: 'PHOTO',
          rules: {
            minParticipants: 10,
            maxParticipants: 100,
            dailyCheckIn: true,
            rewards: {
              first: '500€ Cash',
              second: '300€ Gift Card',
              third: '100€ Store Credit'
            }
          },
          enrollment: {
            id: 'enrollment-1',
            joinedAt: new Date('2025-09-01'),
            status: 'ACTIVE',
            currentStreak: 5,
            totalCheckIns: 5,
            lastCheckIn: new Date()
          },
          _count: { 
            enrollments: 42 
          }
        },
        {
          id: 'cmf7lrtlq000414ehs17u67jz',
          title: 'Meditation Marathon',
          description: '21 days of daily meditation practice',
          imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=300&fit=crop',
          category: 'Wellness',
          startAt: new Date('2025-09-10'),
          endAt: new Date('2025-09-30'),
          isActive: true,
          proofType: 'TEXT',
          rules: {
            minParticipants: 5,
            maxParticipants: 50,
            dailyCheckIn: true,
            rewards: {
              first: 'Premium Meditation App',
              second: 'Meditation Cushion',
              third: 'Wellness Book'
            }
          },
          enrollment: {
            id: 'enrollment-2',
            joinedAt: new Date('2025-09-10'),
            status: 'ACTIVE',
            currentStreak: 3,
            totalCheckIns: 3,
            lastCheckIn: new Date()
          },
          _count: { 
            enrollments: 28 
          }
        }
      ];

      return NextResponse.json({ challenges: mockChallenges });
    }

    // Production mode - fetch user's enrolled challenges
    const challenges = await prisma.challenge.findMany({
      where: {
        enrollments: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        enrollments: {
          where: {
            userId: user.id
          },
          select: {
            id: true,
            joinedAt: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        startAt: 'desc'
      }
    });

    // Transform the data to include enrollment info directly
    const transformedChallenges = challenges.map(challenge => ({
      ...challenge,
      enrollment: challenge.enrollments[0] || null
    }));

    return NextResponse.json({ challenges: transformedChallenges });

  } catch (error) {
    console.error('Error fetching customer challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}
