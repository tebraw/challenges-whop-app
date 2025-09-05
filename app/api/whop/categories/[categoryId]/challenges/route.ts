// app/api/whop/categories/[categoryId]/challenges/route.ts
import { NextResponse } from 'next/server';
import { getChallengesByCategory } from '@/lib/whopApi';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId: categoryId } = await context.params;

    // Get challenges from local database that match this category
    // TODO: After migration, use whopCategoryId filter
    const localChallenges = await prisma.challenge.findMany({
      where: {
        // TODO: Add after migration
        // whopCategoryId: categoryId
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        proofType: true,
        rules: true,
        createdAt: true,
        imageUrl: true,
      },
    });

    // Also get challenges from Whop API (for future integration)
    const whopChallenges = await getChallengesByCategory(categoryId);

    return NextResponse.json({ 
      localChallenges,
      whopChallenges,
      categoryId 
    });
  } catch (error) {
    console.error('Error fetching challenges for category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' }, 
      { status: 500 }
    );
  }
}
