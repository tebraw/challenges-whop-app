import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TEST /api/test-admin-challenges - Test version without auth
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing admin challenges API without auth...');
    
    const challenges = await prisma.challenge.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            winners: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${challenges.length} challenges`);

    // Enhanced with check-ins and streak data
    const enhancedChallenges = await Promise.all(
      challenges.map(async (challenge) => {
        console.log(`Processing challenge: ${challenge.title}`);
        
        // Count total check-ins for this challenge
        const totalCheckIns = await prisma.proof.count({
          where: {
            enrollment: {
              challengeId: challenge.id
            }
          }
        });
        
        console.log(`  - Participants: ${challenge._count.enrollments}`);
        console.log(`  - Total Check-ins: ${totalCheckIns}`);

        // Get all enrollments with their proofs to calculate completion rates
        const enrollments = await prisma.enrollment.findMany({
          where: {
            challengeId: challenge.id
          },
          include: {
            proofs: {
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        });

        const result = {
          ...challenge,
          participants: challenge._count.enrollments,
          checkIns: totalCheckIns,
          streakCount: totalCheckIns // Use total check-ins instead of streak calculation
        };
        
        console.log(`  - Result checkIns: ${result.checkIns}`);
        console.log(`  - Result streakCount: ${result.streakCount}`);
        
        return result;
      })
    );

    console.log('✅ Enhanced challenges created');
    return NextResponse.json({ 
      challenges: enhancedChallenges,
      debug: {
        totalChallenges: challenges.length,
        totalCheckIns: enhancedChallenges.reduce((sum, c) => sum + c.checkIns, 0)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges', details: String(error) },
      { status: 500 }
    );
  }
}
