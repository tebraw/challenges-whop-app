import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWhopUserData, getWhopUserIdByEmail } from '@/lib/whopApi';
import { getCurrentUserId } from '@/lib/auth';

const prisma = new PrismaClient();

// Check if user has Whop membership for this challenge's community
async function checkWhopMembership(request: NextRequest, challenge: any): Promise<boolean> {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return false; // No user logged in
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.email) {
      return false;
    }

    // Get Whop user ID from email
    const whopUserId = await getWhopUserIdByEmail(user.email);
    if (!whopUserId) {
      return false;
    }

    // Get Whop user data to check memberships
    const whopUserData = await getWhopUserData(whopUserId);
    if (!whopUserData) {
      return false;
    }

    // Check if user has active subscription
    return user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
  } catch (error) {
    console.error('Error checking Whop membership:', error);
    return false;
  }
}

// Check if user is admin for development bypass
function checkAdminBypass(request: NextRequest): boolean {
  try {
    // For development, check if user is admin
    const cookies = request.cookies;
    const adminCookie = cookies.get('admin-override')?.value;
    return adminCookie === 'true';
  } catch (error) {
    return false;
  }
}

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

    // Get the challenge with creator info
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        rules: true,
        startAt: true,
        endAt: true,
        proofType: true,
        cadence: true,
        creatorId: true,
        creator: {
          select: {
            name: true,
            email: true,
            isFreeTier: true,
            whopAffiliateLink: true,
            whopCompanyId: true
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
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Check if user has access via Whop membership
    const hasAccess = await checkWhopMembership(request, challenge);
    
    // For development, allow admin bypass
    const isAdmin = checkAdminBypass(request);
    
    // Check if creator offers free tier
    const isCreatorFreeTier = challenge.creator?.isFreeTier ?? true;
    
    // Final access: admin bypass OR (free tier OR paid membership)
    const finalAccess = isAdmin || isCreatorFreeTier || hasAccess;

    // Extract rules and creator info
    const challengeRules = (challenge.rules ?? {}) as any;
    const imageUrl = challengeRules.imageUrl || challenge.imageUrl;
    
    // Generate appropriate join URL based on creator's tier
    const joinUrl = isCreatorFreeTier 
      ? `https://whop.com/checkout/free-community?ref=${challenge.creatorId}`
      : `https://whop.com/checkout/premium-membership?ref=${challenge.creatorId}`;

    return NextResponse.json({
      hasAccess: finalAccess,
      preview: finalAccess ? null : {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        imageUrl,
        startAt: challenge.startAt,
        endAt: challenge.endAt,
        proofType: challenge.proofType,
        cadence: challenge.cadence,
        duration: Math.ceil((new Date(challenge.endAt).getTime() - new Date(challenge.startAt).getTime()) / (1000 * 60 * 60 * 24)),
        participantCount: challenge._count?.enrollments || 0,
        creatorName: challenge.creator?.name || "Creator",
        communityName: isCreatorFreeTier ? "Free Community" : "Premium Community",
        requiresMembership: !isCreatorFreeTier, // Free tier doesn't require membership
        isFree: isCreatorFreeTier,
        joinUrl: joinUrl,
        rewards: challengeRules.rewards || []
      }
    });
  } catch (error) {
    console.error('Error checking challenge access:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}