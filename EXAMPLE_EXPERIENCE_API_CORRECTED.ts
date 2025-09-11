/**
 * 🎯 EXAMPLE: Experience-based API Route (Following Whop Rules 1-10)
 * 
 * This demonstrates how to properly implement Whop Experience-based architecture
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyExperienceAuth, requireMemberAccess, withExperienceScope } from '@/lib/whop-experience-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 🎯 WHOP RULE 1-3: Verify Experience access
    const auth = await verifyExperienceAuth();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 🎯 WHOP RULE 1: Experience-based data scoping
    // Only return challenges that belong to this Experience
    const challenges = await withExperienceScope(async (experienceId) => {
      return prisma.challenge.findMany({
        where: {
          // 🎯 RULE 1: Use experienceId instead of tenantId for data isolation
          experienceId,
          
          // 🎯 RULE 10: Apply role-based visibility
          ...(auth.appRole === 'guest' ? {
            isPublic: true // Guests only see public challenges
          } : {}),
          
          // 🎯 RULE 10: Creator can see draft challenges
          ...(auth.appRole !== 'ersteller' ? {
            featured: true // Non-creators only see featured
          } : {})
        },
        include: {
          enrollments: auth.permissions.canManage ? true : {
            where: {
              user: {
                whopUserId: auth.userId // Users can only see their own participation
              }
            }
          }
        }
      });
    });

    return NextResponse.json({
      challenges,
      userRole: auth.appRole,
      experienceId: auth.experienceId,
      permissions: auth.permissions
    });

  } catch (error) {
    console.error('Experience API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 🎯 WHOP RULE 4: Server-side validation for mutations
    const auth = await requireMemberAccess(); // Require member access to create challenges
    
    // 🎯 WHOP RULE 1 & 4: Experience-scoped challenge creation
    const challenge = await withExperienceScope(async (experienceId) => {
      return prisma.challenge.create({
        data: {
          ...body,
          experienceId, // 🎯 RULE 1: Always scope to current Experience
          creatorId: auth.userId,
          // 🎯 RULE 2: Role-based initial status
          featured: auth.appRole === 'ersteller' // Only ersteller can publish immediately
        }
      });
    });

    return NextResponse.json(challenge);

  } catch (error) {
    if (error.message.includes('Access denied') || error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
