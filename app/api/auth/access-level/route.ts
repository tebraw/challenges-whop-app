// app/api/auth/access-level/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    console.log('🔍 Access Level API: Getting current user...');
    const currentUser = await getCurrentUser();
    console.log('👤 Current user result:', currentUser ? {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      whopCompanyId: currentUser.whopCompanyId,
    } : 'null');
    
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
        }
      });
    }

    // Company Owner = ADMIN Rolle + hat whopCompanyId (or ADMIN in development)
    if (currentUser.role === 'ADMIN' && (currentUser.whopCompanyId || process.env.NODE_ENV === 'development')) {
      console.log('👑 User is company owner - granting full access');
      return NextResponse.json({
        accessLevel: {
          userType: 'company_owner',
          canCreateChallenges: true,
          canViewAdmin: true,
          canViewMyFeed: true,
          canViewDiscover: true,
          userId: currentUser.id,
          companyId: currentUser.whopCompanyId || 'dev-company',
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
      }
    });
  }
}
