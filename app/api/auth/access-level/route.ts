// app/api/auth/access-level/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    console.log('🔍 Access Level API: Getting current user...');
    const currentUser = await getCurrentUser();
    console.log('👤 Current user result:', currentUser ? {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      whopCompanyId: currentUser.whopCompanyId,
    } : 'null');
    
    // Get challengeId from URL params if provided
    const url = new URL(request.url);
    const challengeId = url.searchParams.get('challengeId');
    let isParticipant = false;
    
    // Check if user is already a participant in this specific challenge
    if (currentUser && challengeId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: currentUser.id,
          challengeId: challengeId
        }
      });
      isParticipant = !!enrollment;
      console.log('🎯 Participant check:', { challengeId, isParticipant, enrollment: !!enrollment });
    }
    
    if (!currentUser) {
      // Gast-Benutzer - nur öffentliche Bereiche
      console.log('🚪 No user found, returning guest access');
      return NextResponse.json({
        accessLevel: {
          userType: 'guest',
          canCreateChallenges: false,
          canViewAdmin: false,
          canViewMyFeed: false,
          canViewDiscover: true,
          isParticipant: false,
        }
      });
    }

    // Company Owner = ADMIN Rolle + hat whopCompanyId
    if (currentUser.role === 'ADMIN' && currentUser.whopCompanyId) {
      console.log('👑 User is company owner - granting admin access (NO DISCOVER)');
      return NextResponse.json({
        accessLevel: {
          userType: 'company_owner',
          canCreateChallenges: true,
          canViewAdmin: true,
          canViewMyFeed: false,  // Company Owners don't need My Feed
          canViewDiscover: false,  // Company Owners don't need Discover
          userId: currentUser.id,
          companyId: currentUser.whopCompanyId,
          isParticipant,
        }
      });
    }

    // Customer = USER Rolle oder ADMIN ohne Company ID
    console.log('👤 User is customer - granting limited access');
    return NextResponse.json({
      accessLevel: {
        userType: 'customer',
        canCreateChallenges: false,
        canViewAdmin: false,
        canViewMyFeed: true,
        canViewDiscover: true,
        userId: currentUser.id,
        companyId: currentUser.whopCompanyId || undefined,
        isParticipant,
      }
    });

  } catch (error) {
    console.error('❌ Error determining user access level:', error);
    // Bei Fehler als Gast behandeln
    return NextResponse.json({
      accessLevel: {
        userType: 'guest',
        canCreateChallenges: false,
        canViewAdmin: false,
        canViewMyFeed: false,
        canViewDiscover: true,
        isParticipant: false,
      }
    });
  }
}
