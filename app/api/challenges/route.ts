import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { requireAdmin, getCurrentUserId } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const challenges = await prisma.challenge.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // SICHERHEIT: Nur Admins können Challenges erstellen
    await requireAdmin();
    
    const body = await request.json();
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get default tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: 'Default Tenant' }
      });
    }

    // Ensure user exists
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      // Create a demo user if it doesn't exist
      user = await prisma.user.create({
        data: {
          id: userId,
          email: "demo@example.com",
          name: "Demo User",
          tenantId: tenant.id,
          role: "ADMIN"
        }
      });
    }

    const challenge = await prisma.challenge.create({
      data: {
        title: body.title,
        description: body.description,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        proofType: body.proofType || 'TEXT',
        imageUrl: body.imageUrl || '', // Store image URL at top level
        rules: {
          cadence: body.cadence || 'DAILY',
          maxParticipants: body.maxParticipants || null,
          rewards: body.rewards || [],
          policy: body.policy || '',
          imageUrl: body.imageUrl || '',
          difficulty: body.difficulty || 'BEGINNER'
        },
        tenantId: tenant.id,
        creatorId: user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    });

    return NextResponse.json(challenge, { status: 201 });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: `Failed to create challenge: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
