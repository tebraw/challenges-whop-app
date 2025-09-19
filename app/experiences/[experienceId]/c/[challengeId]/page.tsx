import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk-unified';
import Link from 'next/link';
import { ArrowLeft, Users, CheckCircle, Award } from 'lucide-react';
import JoinChallengeButton from '@/components/experiences/JoinChallengeButton';
import ProofForm from '@/components/user/ProofForm';
import ChallengeOffers from '@/components/experiences/ChallengeOffers';

interface PageProps {
  params: Promise<{ experienceId: string; challengeId: string }>;
}

export default async function ExperienceChallengePage({ params }: PageProps) {
  try {
    const { experienceId, challengeId } = await params;
    
    // Get headers for authentication
    const headersList = await headers();
    const whopUserToken = headersList.get('x-whop-user-token');
    const whopUserId = headersList.get('x-whop-user-id') || headersList.get('x-user-id');
    const whopCompanyId = headersList.get('x-whop-company-id');
    
    
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

    // Prepare Whop headers for client components (use actual userId from SDK)
    const whopHeaders = {
      userToken: whopUserToken || undefined,
      userId: userId, // Use the verified userId from SDK
      experienceId: experienceId,
      companyId: whopCompanyId || undefined
    };
    
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
      const startDate = challenge.startAt ? new Date(challenge.startAt) : new Date();
      const endDate = challenge.endAt ? new Date(challenge.endAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now as fallback
      const today = new Date();
      
      // For daily challenges: since only 1 proof per day is possible, 
      // allProofs.length = number of days with proofs
      // maxCheckIns = total challenge duration in days
      // For END_OF_CHALLENGE: only 1 proof total required, anytime during challenge
      let completedCheckIns, maxCheckIns;
      
      if (challenge.cadence === 'DAILY') {
        // Total challenge duration in days
        const totalChallengeDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        completedCheckIns = allProofs.length; // = days with proofs (since 1 proof/day max)
        maxCheckIns = totalChallengeDays;
      } else if (challenge.cadence === 'END_OF_CHALLENGE') {
        // Only 1 proof required total, regardless of challenge duration
        completedCheckIns = allProofs.length > 0 ? 1 : 0; // Either 0 or 1
        maxCheckIns = 1;
      } else {
        // For weekly or other cadences, use elapsed time approach
        const elapsedDays = Math.floor((Math.min(today.getTime(), endDate.getTime()) - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        completedCheckIns = allProofs.length;
        maxCheckIns = elapsedDays;
      }
      
      const completionRate = maxCheckIns > 0 ? (completedCheckIns / maxCheckIns) * 100 : 0;
      
      // Check if user can check in - different logic for different cadences
      const todayString = today.toISOString().split('T')[0];
      const hasCheckedInToday = allProofs.some((proof: any) => 
        proof.createdAt && new Date(proof.createdAt).toISOString().split('T')[0] === todayString
      );
      
      let canCheckInToday, hasExistingProof;
      if (challenge.cadence === 'END_OF_CHALLENGE') {
        // For END_OF_CHALLENGE: can always submit/replace proof during active challenge
        canCheckInToday = today >= startDate && today <= endDate;
        hasExistingProof = allProofs.length > 0;
      } else {
        // For DAILY: can only submit once per day
        canCheckInToday = today >= startDate && today <= endDate && !hasCheckedInToday;
        hasExistingProof = hasCheckedInToday;
      }
      
      // Get existing proof - different logic for different cadences
      let todayProof;
      if (challenge.cadence === 'END_OF_CHALLENGE') {
        // For END_OF_CHALLENGE: get the latest proof (there should be max 1)
        todayProof = allProofs.length > 0 ? allProofs[0] : null;
      } else {
        // For DAILY: get today's proof specifically
        todayProof = allProofs.find((proof: any) => 
          proof.createdAt && new Date(proof.createdAt).toISOString().split('T')[0] === todayString
        );
      }
      
      userStats = {
        completedCheckIns,
        maxCheckIns,
        completionRate,
        canCheckInToday,
        hasCheckedInToday: hasExistingProof,
        todayProof,
        joinedAt: userEnrollment.joinedAt ? new Date(userEnrollment.joinedAt).toISOString() : new Date().toISOString(),
        lastCheckin: allProofs[0]?.createdAt ? new Date(allProofs[0].createdAt).toISOString() : undefined
      };
    }
    
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-6xl">
          {/* Back button - Mobile optimized */}
          <Link href={`/experiences/${experienceId}`}>
            <button className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 sm:mb-6 transition-colors group touch-target">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm sm:text-base">Back to Challenges</span>
            </button>
          </Link>
          
          {/* Hero Section - Mobile First Design */}
          <div className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-indigo-600/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-purple-500/20">
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
              {/* Challenge Image - Mobile centered, desktop left */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                {challenge.imageUrl ? (
                  <img
                    src={challenge.imageUrl}
                    alt={challenge.title}
                    className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 object-cover rounded-2xl sm:rounded-3xl border-2 border-purple-500/30"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl sm:rounded-3xl flex items-center justify-center text-4xl sm:text-6xl lg:text-8xl border-2 border-purple-500/20">
                    🎯
                  </div>
                )}
              </div>
              
              {/* Challenge Info - Mobile stacked, desktop right */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
                  {challenge.title}
                </h1>
                
                {challenge.description && (
                  <p className="text-gray-300 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 leading-relaxed">
                    {challenge.description}
                  </p>
                )}
                
                {/* Info Section - Clean minimal design without boxes */}
                <div className="mb-6 sm:mb-8">
                  {/* Basic Info Grid - 2 columns on mobile, flowing on desktop */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-x-6 gap-y-4 sm:gap-x-8 sm:gap-y-6 lg:gap-x-12 mb-4">
                    {/* Participants */}
                    <div className="flex items-center gap-2 min-h-[44px]">
                      <span className="text-xl sm:text-2xl">👥</span>
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm sm:text-base">{challenge._count.enrollments}</span>
                        <span className="text-gray-400 text-xs sm:text-sm">participants</span>
                      </div>
                    </div>
                    
                    {/* Date Range */}
                    <div className="flex items-center gap-2 min-h-[44px]">
                      <span className="text-xl sm:text-2xl">📅</span>
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm sm:text-base">
                          <span className="hidden sm:inline">
                            {new Date(challenge.startAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(challenge.endAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="sm:hidden">
                            {new Date(challenge.startAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </span>
                        <span className="text-gray-400 text-xs sm:text-sm">
                          <span className="hidden sm:inline">duration</span>
                          <span className="sm:hidden">start date</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Commitment Type */}
                    <div className="flex items-center gap-2 min-h-[44px] col-span-2 sm:col-span-1">
                      <span className="text-xl sm:text-2xl">🔄</span>
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm sm:text-base">
                          {challenge.cadence === 'DAILY' ? 'Daily Check-ins' : challenge.cadence === 'END_OF_CHALLENGE' ? 'Single Submission' : 'Regular'}
                        </span>
                        <span className="text-gray-400 text-xs sm:text-sm">
                          {challenge.cadence === 'DAILY' ? 'proof required each day' : challenge.cadence === 'END_OF_CHALLENGE' ? 'one proof at completion' : 'commitment'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* User Status Info - Only if participating */}
                  {isParticipating && userStats && (
                    <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-gray-700/50">
                      {/* Joined Status */}
                      <div className="flex items-center gap-2 min-h-[44px]">
                        <span className="text-xl sm:text-2xl">⭐</span>
                        <div className="flex flex-col">
                          <span className="text-purple-300 font-medium text-sm sm:text-base">Joined</span>
                          <span className="text-gray-400 text-xs sm:text-sm">participating</span>
                        </div>
                      </div>
                      
                      {/* Progress Stats */}
                      <div className="flex items-center gap-2 min-h-[44px]">
                        <span className="text-xl sm:text-2xl">📊</span>
                        <div className="flex flex-col">
                          <span className="text-green-300 font-medium text-sm sm:text-base">
                            {userStats.completedCheckIns}/{userStats.maxCheckIns} ({Math.round(userStats.completionRate)}%)
                          </span>
                          <span className="text-gray-400 text-xs sm:text-sm">progress</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons - Mobile stacked, touch-friendly */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <div className="w-full sm:w-auto">
                    <JoinChallengeButton 
                      challengeId={challengeId}
                      experienceId={experienceId}
                      isEnrolled={isParticipating}
                    />
                  </div>
                  
                  {userStats?.canCheckInToday && (
                    <a href="#checkin" className="scroll-smooth block w-full sm:w-auto">
                      <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-green-500/25 transform hover:scale-105 flex items-center gap-2 justify-center min-h-[48px] sm:min-h-[56px]">
                        <span className="text-lg sm:text-xl">⚡</span>
                        <span className="text-sm sm:text-base">Check in Today</span>
                      </button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rewards Section - Mobile optimized */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-3xl sm:text-4xl">🏆</span>
                <span>Rewards & Prizes</span>
              </h2>
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg">Complete this challenge and earn amazing rewards!</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Dynamische Rewards aus Admin-Daten */}
              {challenge.rules && 
               typeof challenge.rules === 'object' && 
               challenge.rules !== null &&
               'rewards' in challenge.rules && 
               Array.isArray((challenge.rules as any).rewards) && 
               (challenge.rules as any).rewards.length > 0 ? (
                (challenge.rules as any).rewards.map((reward: any, index: number) => (
                  <div key={index} className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:border-yellow-400/50 transition-all duration-300 group min-h-[140px] sm:min-h-[160px] flex flex-col justify-center">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎁'}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-yellow-300 mb-2 leading-tight">
                      {reward.title || reward.name || `Reward #${index + 1}`}
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      {reward.description || reward.details || reward.requirement || 'Amazing reward awaits!'}
                    </p>
                    {reward.position && (
                      <div className="mt-3 bg-yellow-500/20 rounded-full px-3 py-1 text-yellow-200 text-xs sm:text-sm font-medium inline-block">
                        #{reward.position}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Fallback Rewards falls keine Admin-Daten vorhanden
                <>
                  <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:border-yellow-400/50 transition-all duration-300 group min-h-[140px] sm:min-h-[160px] flex flex-col justify-center">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">🥇</div>
                    <h3 className="text-lg sm:text-xl font-bold text-yellow-300 mb-2">#1 1 on 1 Coaching Session</h3>
                    <p className="text-gray-300 text-sm sm:text-base">Live coaching with me</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-500/20 to-gray-400/20 border border-gray-400/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:border-gray-300/50 transition-all duration-300 group min-h-[140px] sm:min-h-[160px] flex flex-col justify-center">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">🥈</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-300 mb-2">#2 1 Week Meal Plan</h3>
                    <p className="text-gray-300 text-sm sm:text-base">Personalized nutrition guide</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:border-orange-400/50 transition-all duration-300 group min-h-[140px] sm:min-h-[160px] flex flex-col justify-center sm:col-span-2 lg:col-span-1">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">🥉</div>
                    <h3 className="text-lg sm:text-xl font-bold text-orange-300 mb-2">#3 Free Abs Workout PDF</h3>
                    <p className="text-gray-300 text-sm sm:text-base">Premium workout guide</p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Challenge Info Cards - Mobile optimized */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="text-3xl sm:text-4xl">🎯</div>
                <h3 className="text-xl sm:text-2xl font-bold text-green-300">Challenge Yourself</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                Join a community of motivated individuals working towards their goals. Track your progress and stay accountable with daily check-ins.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="text-3xl sm:text-4xl">🏆</div>
                <h3 className="text-xl sm:text-2xl font-bold text-purple-300">Earn Recognition</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                Complete the challenge to earn your spot on the leaderboard and gain recognition for your dedication and consistency.
              </p>
            </div>
          </div>
          
          {/* Challenge Timeline/Terms - Mobile optimized */}
          {!isParticipating ? (
            // Info Card for non-participants
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="text-2xl sm:text-3xl mt-1 sm:mt-0">ℹ️</div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-blue-300 mb-1 leading-tight">
                      Challenge starts on {new Date(challenge.startAt).toLocaleDateString()}
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base">
                      {Math.ceil((new Date(challenge.endAt).getTime() - new Date(challenge.startAt).getTime()) / (1000 * 60 * 60 * 24))} days • {challenge._count.enrollments} participants
                    </p>
                  </div>
                </div>
                
                <div className="w-full sm:w-auto">
                  <JoinChallengeButton challengeId={challengeId} experienceId={experienceId} isEnrolled={false} />
                </div>
              </div>
            </div>
          ) : (
            // Terms & Policy Card for participants
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <button 
                onClick={() => {
                  const modal = document.getElementById('challenge-terms-modal');
                  if (modal) {
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                  }
                }}
                className="w-full text-left hover:bg-purple-500/5 transition-all duration-200 rounded-xl p-2 -m-2 group"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">📜</div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-purple-300 mb-1 leading-tight group-hover:text-purple-200 transition-colors">
                      Challenge Terms & Policy
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base group-hover:text-gray-300 transition-colors">
                      Click to view challenge guidelines and requirements
                    </p>
                  </div>
                  <div className="text-gray-400 group-hover:text-purple-300 transition-colors">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Challenge Terms Modal */}
          <div 
            id="challenge-terms-modal" 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                const modal = document.getElementById('challenge-terms-modal');
                if (modal) {
                  modal.style.display = 'none';
                  document.body.style.overflow = 'auto';
                }
              }
            }}
          >
            <div className="bg-gray-900 border border-gray-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">📜</span>
                  Challenge Terms & Policy
                </h2>
                <button
                  onClick={() => {
                    const modal = document.getElementById('challenge-terms-modal');
                    if (modal) {
                      modal.style.display = 'none';
                      document.body.style.overflow = 'auto';
                    }
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="prose prose-invert max-w-none">
                {challenge.rules && 
                 typeof challenge.rules === 'object' && 
                 challenge.rules !== null &&
                 'terms' in challenge.rules && 
                 (challenge.rules as any).terms ? (
                  <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                    {(challenge.rules as any).terms}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    <div className="text-4xl mb-4">📋</div>
                    <p>No specific terms and policies have been set for this challenge.</p>
                    <p className="mt-2 text-sm">Please follow general community guidelines and challenge requirements.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-700">
                <button
                  onClick={() => {
                    const modal = document.getElementById('challenge-terms-modal');
                    if (modal) {
                      modal.style.display = 'none';
                      document.body.style.overflow = 'auto';
                    }
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 font-semibold text-white shadow-lg hover:shadow-purple-500/25"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>

          {/* User Progress - Mobile optimized */}
          {isParticipating && userStats && (
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm mt-6 sm:mt-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                <span className="text-2xl sm:text-3xl">📈</span>
                <span>Your Progress</span>
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-700/50 rounded-xl sm:rounded-2xl min-h-[60px]">
                    <span className="text-gray-300 font-medium text-sm sm:text-base">Check-ins completed:</span>
                    <span className="font-bold text-lg sm:text-xl text-green-400">{userStats.completedCheckIns} / {userStats.maxCheckIns}</span>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-gray-700/50 rounded-xl sm:rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-300 font-medium text-sm sm:text-base">Completion Rate:</span>
                      <span className="font-bold text-lg sm:text-xl text-purple-400">{Math.round(userStats.completionRate)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3 sm:h-4">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 sm:h-4 rounded-full transition-all duration-500 shadow-lg"
                        style={{ width: `${userStats.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center items-center p-4 sm:p-6">
                  {userStats.canCheckInToday ? (
                    <div className="text-center">
                      <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">✅</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-green-400 mb-3 sm:mb-4">Ready to Check In!</h3>
                      <p className="text-gray-300 text-sm sm:text-base">Scroll down to submit your proof</p>
                    </div>
                  ) : userStats.hasCheckedInToday ? (
                    <div className="text-center">
                      <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🎉</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-blue-400 mb-2">Great job!</h3>
                      <p className="text-gray-300 text-sm sm:text-base">You've already checked in today</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">⏰</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-400 mb-2">Check-in Completed</h3>
                      <p className="text-gray-300 text-sm sm:text-base">Come back tomorrow</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Challenge Offers Section - Show special offers based on user progress */}
          {isParticipating && (
            <ChallengeOffers 
              challengeId={challengeId}
              whopHeaders={whopHeaders}
            />
          )}

          {/* Check-in/Proof Upload Section - Mobile optimized */}
          {isParticipating && (userStats?.canCheckInToday || userStats?.hasCheckedInToday) && (
            <div id="checkin" className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mt-6 sm:mt-8">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-4xl">⚡</span>
                  <span className="leading-tight">
                    {userStats?.hasCheckedInToday 
                      ? (challenge.cadence === 'END_OF_CHALLENGE' ? 'Edit Your Proof' : 'Edit Today\'s Check-in')
                      : (challenge.cadence === 'END_OF_CHALLENGE' ? 'Submit Your Proof' : 'Daily Check-in')
                    }
                  </span>
                </h2>
                <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed">
                  {userStats?.hasCheckedInToday 
                    ? (challenge.cadence === 'END_OF_CHALLENGE' 
                       ? 'You can edit or replace your proof anytime during the challenge!' 
                       : 'You can edit or replace your proof for today!'
                      )
                    : (challenge.cadence === 'END_OF_CHALLENGE'
                       ? 'Submit your proof for this challenge!'
                       : 'Submit your proof for today\'s progress!'
                      )
                  }
                </p>
              </div>
              
              <div className="max-w-2xl mx-auto">
                <ProofForm 
                  challengeId={challengeId} 
                  enrolled={true}
                  challenge={{
                    cadence: challenge.cadence || 'daily',
                    existingProofToday: userStats?.hasCheckedInToday || false,
                    proofType: challenge.proofType || 'FILE'
                  }}
                  whopHeaders={whopHeaders}
                  todayProof={userStats?.todayProof || null}
                />
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