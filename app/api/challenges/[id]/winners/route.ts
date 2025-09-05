import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';

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

    const winners = await prisma.challengeWinner.findMany({
      where: { challengeId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { place: 'asc' }
    });

    return NextResponse.json(winners);
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // SICHERHEIT: Nur Admins können Gewinner auswählen
    await requireAdmin();
    
    const { id } = await context.params;
    const { winners } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    if (!winners || !Array.isArray(winners) || winners.length === 0) {
      return NextResponse.json(
        { error: 'Winners array with at least one winner is required' },
        { status: 400 }
      );
    }

    // Delete existing winners for this challenge first
    await prisma.challengeWinner.deleteMany({
      where: { challengeId: id }
    });

    // Get challenge info (optional, for logging)
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: { title: true }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Create new winners
    const createdWinners = [];
    
    for (const winner of winners) {
      if (!winner.userId || !winner.place) {
        return NextResponse.json(
          { error: 'Each winner must have userId and place' },
          { status: 400 }
        );
      }

      const createdWinner = await prisma.challengeWinner.create({
        data: {
          challengeId: id,
          userId: winner.userId,
          place: winner.place
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });
      createdWinners.push(createdWinner);
    }

    return NextResponse.json({ 
      message: 'Winners saved successfully',
      winners: createdWinners 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating winners:', error);
    return NextResponse.json(
      { error: 'Failed to create winners' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
