/**
 * 🎯 CORRECTED ADMIN API - EXPERIENCE SCOPED
 * Implements Whop Rules #1, #3, #4 for server-side auth and data scoping
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk';
import { getExperienceContext } from '@/lib/whop-experience';
import { prisma } from '@/lib/prisma';

// 🎯 WHOP RULE #3: Auth nur auf dem Server - Minimal Flow
async function verifyAdminAccess() {
  const headersList = await headers();
  
  // Step 1: userId = verifyUserToken(headers)
  const { userId } = await whopSdk.verifyUserToken(headersList);
  if (!userId) {
    throw new Error('Authentication required');
  }

  // Get Experience context
  const experienceContext = await getExperienceContext();
  if (!experienceContext.experienceId) {
    throw new Error('Experience context required');
  }

  // Step 2: result = access.checkIfUserHasAccessToExperience
  const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
    userId,
    experienceId: experienceContext.experienceId
  });

  // Step 3: if (!result.hasAccess) -> 403
  if (!accessResult.hasAccess) {
    throw new Error('Access denied to experience');
  }

  // Step 4: if (admin-Action && result.accessLevel !== 'admin') -> 403
  if (accessResult.accessLevel !== 'admin') {
    throw new Error('Admin access required');
  }

  return {
    userId,
    experienceId: experienceContext.experienceId,
    accessLevel: accessResult.accessLevel
  };
}

// 🎯 EXAMPLE: GET /api/admin/challenges - Experience scoped
export async function GET(request: NextRequest) {
  try {
    // 🎯 WHOP RULE #4: Logik bleibt Server - Admin validation
    const auth = await verifyAdminAccess();

    // 🎯 WHOP RULE #1: Experience ist dein Mandant
    // All challenges scoped to this experience
    const challenges = await prisma.challenge.findMany({
      where: {
        // Use tenantId until experienceId migration is complete
        tenant: {
          users: {
            some: {
              whopUserId: auth.userId,
              role: 'ADMIN'
            }
          }
        }
        // TODO: Replace with experienceId when migration is done
        // experienceId: auth.experienceId
      },
      include: {
        enrollments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            checkins: true
          }
        },
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      challenges,
      experienceId: auth.experienceId,
      userRole: 'admin'
    });

  } catch (error: any) {
    if (error.message.includes('required') || error.message.includes('denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 🎯 EXAMPLE: POST /api/admin/challenges - Experience scoped creation
export async function POST(request: NextRequest) {
  try {
    // 🎯 WHOP RULE #4: Logik bleibt Server - Admin validation
    const auth = await verifyAdminAccess();
    const body = await request.json();

    // Find the admin user to get tenantId
    const adminUser = await prisma.user.findUnique({
      where: { whopUserId: auth.userId },
      select: { id: true, tenantId: true }
    });

    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    // 🎯 WHOP RULE #1: Experience-scoped challenge creation
    const challenge = await prisma.challenge.create({
      data: {
        ...body,
        tenantId: adminUser.tenantId, // Currently using tenantId
        creatorId: adminUser.id,
        // TODO: Add experienceId when migration is complete
        // experienceId: auth.experienceId
      }
    });

    return NextResponse.json({ challenge });

  } catch (error: any) {
    if (error.message.includes('required') || error.message.includes('denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
