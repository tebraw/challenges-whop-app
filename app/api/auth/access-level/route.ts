// app/api/auth/access-level/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      // Gast-Benutzer - nur öffentliche Bereiche
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

    // Company Owner = ADMIN Rolle + hat whopCompanyId
    if (currentUser.role === 'ADMIN' && currentUser.whopCompanyId) {
      return NextResponse.json({
        accessLevel: {
          userType: 'company_owner',
          canCreateChallenges: true,
          canViewAdmin: true,
          canViewMyFeed: true,
          canViewDiscover: true,
          userId: currentUser.id,
          companyId: currentUser.whopCompanyId,
        }
      });
    }

    // Customer = USER Rolle oder ADMIN ohne Company ID
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
    console.error('Error determining user access level:', error);
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
