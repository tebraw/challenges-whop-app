// app/api/discover/challenges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categorizeChallenge } from '@/lib/challenge-categories';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const difficulty = searchParams.get('difficulty');
    const id = searchParams.get('id'); // Single challenge by ID
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // If requesting a specific challenge by ID
    if (id) {
      const challenge = await prisma.challenge.findUnique({
        where: { 
          id: id,
          isPublic: true 
        },
        include: {
          tenant: true,
          _count: {
            select: {
              enrollments: true
            }
          }
        },
        select: {
          id: true,
          title: true,
          description: true,
          startAt: true,
          endAt: true,
          proofType: true,
          cadence: true,
          image: true,
          category: true,
          difficulty: true,
          isPublic: true,
          rules: true, // Include rules for rewards
          tenant: {
            select: {
              id: true,
              name: true,
              whopCompanyId: true,
              whopHandle: true,
              whopProductId: true
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      });

      if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
      }

      // Auto-categorize if needed
      const categoryValue = challenge.category || categorizeChallenge(
        challenge.title,
        challenge.description,
        challenge.tenant?.name || null,
        null
      );
      
      if (!challenge.category && categoryValue) {
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: { category: categoryValue }
        });
        challenge.category = categoryValue;
      }

      return NextResponse.json({
        challenges: [challenge],
        total: 1,
        hasMore: false
      });
    }

    // Build where conditions for filtering
    const where: any = {
      isPublic: true
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty.toUpperCase();
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Get challenges with pagination
    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        include: {
          tenant: true,
          _count: {
            select: {
              enrollments: true
            }
          }
        },
        select: {
          id: true,
          title: true,
          description: true,
          startAt: true,
          endAt: true,
          proofType: true,
          cadence: true,
          image: true,
          category: true,
          difficulty: true,
          isPublic: true,
          rules: true, // Include rules for rewards
          featured: true,
          createdAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              whopCompanyId: true,
              whopHandle: true,
              whopProductId: true
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        },
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.challenge.count({ where })
    ]);

    // Auto-categorize challenges that don't have a category
    const updatedChallenges = await Promise.all(
      challenges.map(async (challenge: any) => {
        if (!challenge.category) {
          const categoryValue = categorizeChallenge(
            challenge.title,
            challenge.description,
            challenge.tenant?.name || null,
            null
          );
          
          // Update the challenge in the database
          await prisma.challenge.update({
            where: { id: challenge.id },
            data: { category: categoryValue }
          });
          
          return { ...challenge, category: categoryValue };
        }
        return challenge;
      })
    );

    const hasMore = offset + limit < total;

    return NextResponse.json({
      challenges: updatedChallenges,
      total,
      hasMore,
      pagination: {
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    });

  } catch (error) {
    console.error('Discover challenges API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}
