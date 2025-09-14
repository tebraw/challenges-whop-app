import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ experienceId: string; challengeId: string }>;
}

export default async function ExperienceChallengePage({ params }: PageProps) {
  try {
    const { experienceId, challengeId } = await params;
    
    // Get headers for authentication
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    
    if (!whopUserToken) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Required</h1>
            <p className="text-gray-400">Please access this app through Whop.</p>
          </div>
        </div>
      );
    }
    
    // Verify user access
    const { userId } = await whopSdk.verifyUserToken(headersList);
    const whopUser = await whopSdk.users.getUser({ userId }).catch(() => null);
    
    const experienceAccess = await whopSdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId
    });
    
    if (!experienceAccess.hasAccess) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-400">You don't have access to this experience.</p>
          </div>
        </div>
      );
    }
    
    // Find or create user in our database
    const user = await prisma.user.findUnique({
      where: { whopUserId: userId },
      include: { tenant: true }
    });
    
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-gray-400">Please refresh the page.</p>
          </div>
        </div>
      );
    }
    
    // Load challenge with user participation data
    const challenge = await prisma.challenge.findFirst({
      where: {
        id: challengeId,
        tenantId: user.tenantId, // Ensure tenant isolation
        experienceId: experienceId
      },
      include: {
        enrollments: {
          where: { userId: user.id },
          include: {
            proofs: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        _count: {
          select: { enrollments: true }
        },
        tenant: true
      }
    });
    
    if (!challenge) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Challenge not found</h1>
            <p className="text-gray-400 mb-8">The challenge you're looking for doesn't exist or you don't have access to it.</p>
            <Link href={`/experiences/${experienceId}`}>
              <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors">
                Back to Experience
              </button>
            </Link>
          </div>
        </div>
      );
    }
    
    const userEnrollment = challenge.enrollments[0];
    const isParticipating = !!userEnrollment;
    
    // Calculate user stats if participating
    let userStats = null;
    if (isParticipating && userEnrollment) {
      const allProofs = userEnrollment.proofs;
      
      // Calculate max possible check-ins based on challenge duration and cadence
      const startDate = new Date(challenge.startAt);
      const endDate = new Date(challenge.endAt);
      const today = new Date();
      
      const maxCheckIns = Math.floor((Math.min(today.getTime(), endDate.getTime()) - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const completedCheckIns = allProofs.length;
      const completionRate = maxCheckIns > 0 ? (completedCheckIns / maxCheckIns) * 100 : 0;
      
      // Check if user can check in today
      const todayString = today.toISOString().split('T')[0];
      const hasCheckedInToday = allProofs.some((proof: any) => 
        proof.createdAt.toISOString().split('T')[0] === todayString
      );
      const canCheckInToday = today >= startDate && today <= endDate && !hasCheckedInToday;
      
      userStats = {
        completedCheckIns,
        maxCheckIns,
        completionRate,
        canCheckInToday,
        hasCheckedInToday,
        joinedAt: userEnrollment.createdAt.toISOString(),
        lastCheckin: allProofs[0]?.createdAt.toISOString()
      };
    }
    
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Link href={`/experiences/${experienceId}`}>
            <button className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Experience
            </button>
          </Link>
          
          {/* Challenge Header */}
          <div className="bg-gray-800 rounded-xl p-8 mb-8">
            <h1 className="text-4xl font-bold mb-4">{challenge.title}</h1>
            {challenge.description && (
              <p className="text-gray-300 text-lg mb-6">{challenge.description}</p>
            )}
            
            {/* Challenge Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  {challenge._count.enrollments}
                </div>
                <div className="text-gray-400">Participants</div>
              </div>
              
              {isParticipating && userStats && (
                <>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-2">
                      {userStats.completedCheckIns}
                    </div>
                    <div className="text-gray-400">Your Check-ins</div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-2">
                      {Math.round(userStats.completionRate)}%
                    </div>
                    <div className="text-gray-400">Completion Rate</div>
                  </div>
                </>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex gap-4">
              {!isParticipating ? (
                <Link href={`/c/${challengeId}`}>
                  <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors">
                    Join Challenge
                  </button>
                </Link>
              ) : (
                <Link href={`/c/${challengeId}`}>
                  <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors">
                    View Full Challenge
                  </button>
                </Link>
              )}
            </div>
          </div>
          
          {/* User Progress (if participating) */}
          {isParticipating && userStats && (
            <div className="bg-gray-800 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Your Progress</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Check-ins completed:</span>
                  <span className="font-bold">{userStats.completedCheckIns} / {userStats.maxCheckIns}</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${userStats.completionRate}%` }}
                  ></div>
                </div>
                
                {userStats.canCheckInToday && (
                  <div className="mt-6">
                    <Link href={`/c/${challengeId}#checkin`}>
                      <button className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors">
                        Check in Today
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
    
  } catch (error) {
    console.error('Experience challenge page error:', error);
    
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-400">Please try again later.</p>
        </div>
      </div>
    );
  }
}