import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdminOrCompanyOwner } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    // Get headers first for company owner detection
    const headers = Object.fromEntries(request.headers.entries());
    const companyId = headers['x-whop-company-id'];
    console.log('🏢 Company ID from headers:', companyId);
    
    // Check for company owner first (this works!)
    if (companyId) {
      console.log('✅ Company owner access detected, proceeding without getCurrentUser');
      // Company owners have access, skip user lookup
    } else {
      // Fallback to admin check only if no company ID
      await requireAdminOrCompanyOwner();
      const user = await getCurrentUser();

      if (!user || !user.tenantId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    console.log('✅ Access granted - proceeding with Winners API');
    
    const { challengeId } = await params;
    const { winners } = await request.json();

    if (!winners || !Array.isArray(winners)) {
      return NextResponse.json(
        { error: "Winners array is required" },
        { status: 400 }
      );
    }

    // 🔒 TENANT ISOLATION: For company owners, find tenant by company ID
    let targetTenantId = null;
    
    if (companyId) {
      // Find tenant by company ID for company owners
      const tenant = await prisma.tenant.findFirst({
        where: { whopCompanyId: companyId }
      });
      targetTenantId = tenant?.id;
      console.log('🏢 Found tenant for company:', targetTenantId);
    } else {
      // Use user's tenant for admin users
      const user = await getCurrentUser();
      targetTenantId = user?.tenantId;
      console.log('👤 Using user tenant:', targetTenantId);
    }

    if (!targetTenantId) {
      console.log('❌ No tenant found');
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // 🔒 TENANT ISOLATION: Validate challenge exists and belongs to target tenant
    const challenge = await prisma.challenge.findUnique({
      where: { 
        id: challengeId,
        tenantId: targetTenantId  // 🔒 SECURITY: Only allow access to target tenant
      },
      select: {
        id: true,
        title: true,
        experienceId: true  // ✅ NEEDED: For Experience-targeted notifications
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Delete existing winners for this challenge
    await prisma.challengeWinner.deleteMany({
      where: { challengeId },
    });

    // Create new winners
    const createdWinners = await Promise.all(
      winners.map(async (winner: any) => {
        // Validate participant exists
        const user = await prisma.user.findUnique({
          where: { id: winner.participantId },
        });

        if (!user) {
          throw new Error(`User not found: ${winner.participantId}`);
        }

        // Check if user is enrolled in this challenge
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            userId: winner.participantId,
            challengeId: challengeId,
          },
        });

        if (!enrollment) {
          throw new Error(`User ${winner.participantId} is not enrolled in this challenge`);
        }

        return prisma.challengeWinner.create({
          data: {
            challengeId: challengeId,
            userId: winner.participantId,
            place: winner.rank,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      })
    );

    // 🔔 CRITICAL FIX: Send notifications to winners with correct Challenge ID
    if (createdWinners.length > 0) {
      console.log('🔔 Sending notifications to', createdWinners.length, 'winners for challenge:', challengeId);
      
      // Import the notification helper
      const { sendWhopNotification, getWhopUserIdByEmail } = await import('@/lib/whopApi');
      
      // Send notification to each winner directly
      for (const winner of createdWinners) {
        try {
          // Get Whop user ID
          const whopUserId = await getWhopUserIdByEmail(winner.user.email);
          
          if (whopUserId) {
            const notification = {
              userId: whopUserId,
              title: `🏆 ${challenge.title} - Winner Announcement`,
              message: `🎉 Congratulations! You won ${winner.place === 1 ? '1st Place' : winner.place === 2 ? '2nd Place' : winner.place === 3 ? '3rd Place' : `${winner.place}${winner.place > 3 ? 'th' : ''} Place`} in this challenge!`
            };
            
            // ✅ CRITICAL: Pass Challenge ID for Experience targeting
            const notificationSent = await sendWhopNotification(notification, challengeId);
            
            if (notificationSent) {
              console.log(`✅ Notification sent to ${winner.user.name} (${whopUserId})`);
            } else {
              console.error(`❌ Failed to send notification to ${winner.user.name}`);
            }
          } else {
            console.error(`❌ No Whop user ID found for ${winner.user.email}`);
          }
        } catch (notificationError) {
          console.error(`❌ Error sending notification to ${winner.user.name}:`, notificationError);
        }
      }
    }

    return NextResponse.json({
      message: `Successfully saved ${createdWinners.length} winners`,
      winners: createdWinners,
    });

  } catch (error) {
    console.error('Error saving winners:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
      try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { challengeId } = await params;

    const winners = await prisma.challengeWinner.findMany({
      where: { challengeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        place: 'asc',
      },
    });

    return NextResponse.json({ winners });

  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
