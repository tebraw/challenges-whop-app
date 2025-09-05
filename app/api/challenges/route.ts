import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getWhopUserFromHeaders } from "@/lib/whop-auth";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get current user and their tenant
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized - No user found' },
        { status: 401 }
      );
    }

    // Get user's tenant manually since tenantId might not be in type yet
    const userWithTenant = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { tenant: true }
    });

    if (!userWithTenant?.tenant) {
      return NextResponse.json(
        { error: 'No tenant found for user' },
        { status: 403 }
      );
    }

    // Only fetch challenges for this user's tenant
    const challenges = await prisma.challenge.findMany({
      where: {
        tenantId: userWithTenant.tenant.id
      },
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
    const body = await request.json();
    
    // Try to get Whop user first
    let whopUser = null;
    try {
      whopUser = await getWhopUserFromHeaders();
    } catch (error) {
      console.log('No Whop user found, using fallback auth');
    }
    
    // Get default tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: 'Default Tenant' }
      });
    }

    let user;
    
    if (whopUser?.userId) {
      // Whop user - try to find existing or create new
      user = await prisma.user.findUnique({
        where: { whopUserId: whopUser.userId }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            whopUserId: whopUser.userId,
            email: whopUser.user?.email || `user-${whopUser.userId}@whop.com`,
            name: whopUser.user?.username || `User ${whopUser.userId.slice(-6)}`,
            tenantId: tenant.id,
            role: "ADMIN"
          }
        });
      }
    } else {
      // Fallback: Create or use demo user for testing
      user = await prisma.user.findFirst({
        where: { email: 'demo@example.com' }
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'demo@example.com',
            name: 'Demo User',
            tenantId: tenant.id,
            role: 'ADMIN'
          }
        });
      }
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
        whopCreatorId: whopUser?.userId || null, // Set Whop creator ID if available
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
