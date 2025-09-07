// app/api/discover/challenges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categorizeChallenge } from '@/lib/challenge-categories';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      isPublic: true,
      // Only show challenges that are either active or starting soon
      OR: [
        { startAt: { lte: new Date() }, endAt: { gte: new Date() } }, // Active
        { startAt: { gte: new Date() } } // Future
      ]
    };

    // Category filter
    if (category && category !== '') {
      where.category = category;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Difficulty filter
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Get challenges with creator info
    const challenges = await prisma.challenge.findMany({
      where,
      include: {
        creator: {
          select: {
            name: true,
            whopCompanyId: true
          }
        },
        tenant: {
          select: {
            name: true,
            whopCompanyId: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' }, // Featured challenges first
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    // Auto-categorize challenges that don't have a category yet
    const challengesWithCategories = challenges.map((challenge: any) => {
      if (!challenge.category || challenge.category === 'general') {
        const autoCategory = categorizeChallenge(
          challenge.title,
          challenge.description,
          challenge.tenant.name,
          challenge.creator?.name || null
        );
        
        // Update challenge category in background (don't await)
        prisma.challenge.update({
          where: { id: challenge.id },
          data: { category: autoCategory }
        }).catch(console.error);
        
        return { ...challenge, category: autoCategory };
      }
      return challenge;
    });

    // Get total count for pagination
    const total = await prisma.challenge.count({ where });

    return NextResponse.json({
      challenges: challengesWithCategories,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Discover challenges API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
