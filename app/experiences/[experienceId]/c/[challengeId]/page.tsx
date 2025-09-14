import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk';
import Link from 'next/link';
import { ArrowLeft, Users, CheckCircle, Award } from 'lucide-react';
import JoinChallengeButton from '@/components/experiences/JoinChallengeButton';

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
    // Try with current experienceId first, then fallback to legacy company ID
    let challenge = await prisma.challenge.findFirst({
      where: {
        id: challengeId,
        tenantId: user.tenantId,
        experienceId: experienceId // Current experience ID (exp_...)
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

    // Fallback: try with legacy company ID format (biz_...)
    if (!challenge && user.tenant?.whopCompanyId) {
      challenge = await prisma.challenge.findFirst({
        where: {
          id: challengeId,
          tenantId: user.tenantId,
          experienceId: user.tenant.whopCompanyId // Legacy company ID
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
    }

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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Back button */}
          <Link href={`/experiences/${experienceId}`}>
            <button className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Challenges
            </button>
          </Link>
          
          {/* Hero Section - genau wie im Screenshot */}
          <div className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-indigo-600/20 rounded-3xl p-8 mb-8 border border-purple-500/20">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Challenge Image - Links wie im Screenshot */}
              <div className="flex-shrink-0">
                {challenge.imageUrl ? (
                  <img
                    src={challenge.imageUrl}
                    alt={challenge.title}
                    className="w-48 h-48 lg:w-64 lg:h-64 object-cover rounded-3xl border-2 border-purple-500/30"
                  />
                ) : (
                  <div className="w-48 h-48 lg:w-64 lg:h-64 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-3xl flex items-center justify-center text-8xl border-2 border-purple-500/20">
                    🎯
                  </div>
                )}
              </div>
              
              {/* Challenge Info - Rechts wie im Screenshot */}
              <div className="flex-1">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {challenge.title}
                </h1>
                
                {challenge.description && (
                  <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                    {challenge.description}
                  </p>
                )}
                
                {/* Emoji Info Row - wie im Screenshot */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {/* Participants */}
                  <div className="flex items-center gap-2 bg-blue-500/20 rounded-full px-4 py-2 border border-blue-500/30">
                    <span className="text-2xl">👥</span>
                    <span className="text-blue-300 font-medium">{challenge._count.enrollments} participants</span>
                  </div>
                  
                  {/* Date */}
                  <div className="flex items-center gap-2 bg-green-500/20 rounded-full px-4 py-2 border border-green-500/30">
                    <span className="text-2xl">📅</span>
                    <span className="text-green-300 font-medium">
                      {new Date(challenge.startAt).toLocaleDateString()} - {new Date(challenge.endAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Daily Commitment */}
                  <div className="flex items-center gap-2 bg-purple-500/20 rounded-full px-4 py-2 border border-purple-500/30">
                    <span className="text-2xl">🔄</span>
                    <span className="text-purple-300 font-medium">Daily commitment</span>
                  </div>
                </div>
                
                {/* User Status */}
                {isParticipating && userStats && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-300 px-4 py-2 rounded-full font-medium">
                      ⭐ Joined
                    </div>
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 text-green-300 px-4 py-2 rounded-full font-medium">
                      📊 {userStats.completedCheckIns}/{userStats.maxCheckIns} check-ins ({Math.round(userStats.completionRate)}%)
                    </div>
                  </div>
                )}
                
                {/* Join Button - prominent wie im Screenshot */}
                <div className="flex gap-4">
                  <JoinChallengeButton 
                    challengeId={challengeId}
                    isEnrolled={isParticipating}
                  />
                  
                  {userStats?.canCheckInToday && (
                    <Link href={`/c/${challengeId}#checkin`}>
                      <button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6 py-4 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-green-500/25 transform hover:scale-105 flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        <span>Check in Today</span>
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rewards Section - wie im Screenshot */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
                <span className="text-4xl">🏆</span>
                Rewards & Prizes
              </h2>
              <p className="text-gray-300 text-lg">Complete this challenge and earn amazing rewards!</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Dynamische Rewards aus Admin-Daten */}
              {challenge.rules?.rewards && Array.isArray(challenge.rules.rewards) && challenge.rules.rewards.length > 0 ? (
                challenge.rules.rewards.map((reward: any, index: number) => (
                  <div key={index} className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-yellow-500/30 rounded-2xl p-6 text-center hover:border-yellow-400/50 transition-all duration-300 group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎁'}
                    </div>
                    <h3 className="text-xl font-bold text-yellow-300 mb-2">
                      {reward.title || reward.name || `Reward #${index + 1}`}
                    </h3>
                    <p className="text-gray-300">
                      {reward.description || reward.details || reward.requirement || 'Amazing reward awaits!'}
                    </p>
                    {reward.position && (
                      <div className="mt-3 bg-yellow-500/20 rounded-full px-3 py-1 text-yellow-200 text-sm font-medium">
                        #{reward.position}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Fallback Rewards falls keine Admin-Daten vorhanden
                <>
                  <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-yellow-500/30 rounded-2xl p-6 text-center hover:border-yellow-400/50 transition-all duration-300 group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🥇</div>
                    <h3 className="text-xl font-bold text-yellow-300 mb-2">#1 1 on 1 Coaching Session</h3>
                    <p className="text-gray-300">Live coaching with me</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-silver-500/20 to-gray-400/20 border border-gray-400/30 rounded-2xl p-6 text-center hover:border-gray-300/50 transition-all duration-300 group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🥈</div>
                    <h3 className="text-xl font-bold text-gray-300 mb-2">#2 1 Week Meal Plan</h3>
                    <p className="text-gray-300">Personalized nutrition guide</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6 text-center hover:border-orange-400/50 transition-all duration-300 group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🥉</div>
                    <h3 className="text-xl font-bold text-orange-300 mb-2">#3 Free Abs Workout PDF</h3>
                    <p className="text-gray-300">Premium workout guide</p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Challenge Info Cards - wie im Screenshot */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">🎯</div>
                <h3 className="text-2xl font-bold text-green-300">Challenge Yourself</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Join a community of motivated individuals working towards their goals. Track your progress and stay accountable with daily check-ins.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">🏆</div>
                <h3 className="text-2xl font-bold text-purple-300">Earn Recognition</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Complete the challenge to earn your spot on the leaderboard and gain recognition for your dedication and consistency.
              </p>
            </div>
          </div>
          
          {/* Challenge Timeline - wie im Screenshot unten */}
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">ℹ️</div>
                <div>
                  <h3 className="text-xl font-bold text-blue-300">Challenge starts on {new Date(challenge.startAt).toLocaleDateString()}</h3>
                  <p className="text-gray-400">
                    {Math.ceil((new Date(challenge.endAt).getTime() - new Date(challenge.startAt).getTime()) / (1000 * 60 * 60 * 24))} days • {challenge._count.enrollments} participants
                  </p>
                </div>
              </div>
              
              {!isParticipating && (
                <Link href={`/c/${challengeId}`}>
                  <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 flex items-center gap-2">
                    <span>🚀</span>
                    <span>Join Challenge</span>
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* User Progress (if participating) */}
          {isParticipating && userStats && (
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-3xl p-8 backdrop-blur-sm mt-8">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <span className="text-3xl">📈</span>
                Your Progress
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-2xl">
                    <span className="text-gray-300 font-medium">Check-ins completed:</span>
                    <span className="font-bold text-xl text-green-400">{userStats.completedCheckIns} / {userStats.maxCheckIns}</span>
                  </div>
                  
                  <div className="p-4 bg-gray-700/50 rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-300 font-medium">Completion Rate:</span>
                      <span className="font-bold text-xl text-purple-400">{Math.round(userStats.completionRate)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-500 shadow-lg"
                        style={{ width: `${userStats.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center items-center">
                  {userStats.canCheckInToday ? (
                    <div className="text-center">
                      <div className="text-6xl mb-4">✅</div>
                      <h3 className="text-2xl font-bold text-green-400 mb-4">Ready to Check In!</h3>
                      <Link href={`/c/${challengeId}#checkin`}>
                        <button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-8 py-4 rounded-2xl transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-green-500/25 transform hover:scale-105">
                          ✨ Check in Today
                        </button>
                      </Link>
                    </div>
                  ) : userStats.hasCheckedInToday ? (
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-2xl font-bold text-blue-400 mb-2">Great job!</h3>
                      <p className="text-gray-300">You've already checked in today</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-6xl mb-4">⏰</div>
                      <h3 className="text-2xl font-bold text-gray-400 mb-2">Check-in Completed</h3>
                      <p className="text-gray-300">Come back tomorrow</p>
                    </div>
                  )}
                </div>
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