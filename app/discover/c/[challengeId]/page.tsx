"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getOptimizedWhopUrlString, generateJoinMessage, trackUrlOptimization } from "@/lib/whop-url-optimizer";

interface Challenge {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  proofType: string;
  cadence: string;
  image?: string;
  category: string;
  difficulty: string;
  rules?: {
    rewards?: Array<{
      place: number;
      title: string;
      desc?: string;
    }>;
  };
  tenant: {
    id: string;
    name: string;
    whopCompanyId?: string;
    whopHandle?: string;      // NEW: Real handle from Whop
    whopProductId?: string;   // NEW: Real product ID from Whop
  };
  _count: {
    enrollments: number;
  };
}

interface UserAccessInfo {
  access: 'admin' | 'customer' | 'no_access';
  user?: any;
  canAccessChallenge: boolean;
  needsWhopAccess: boolean;
  whopJoinUrl?: string;
}

export default function PublicChallengePage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params?.challengeId as string;
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Fetch challenge data
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await fetch(`/api/discover/challenges?id=${challengeId}`);
        const data = await response.json();
        
        console.log('📋 Challenge data response:', data);
        
        if (data.challenges && data.challenges.length > 0) {
          const challengeData = data.challenges[0];
          console.log('📋 Setting challenge:', {
            id: challengeData.id,
            title: challengeData.title,
            tenant: challengeData.tenant
          });
          setChallenge(challengeData);
        } else {
          console.log('❌ No challenge found for ID:', challengeId);
        }
      } catch (error) {
        console.error('Error fetching challenge:', error);
      }
    };

    if (challengeId) {
      fetchChallenge();
    }
  }, [challengeId]);

  // Check user access level and redirect based on role
  useEffect(() => {
    const checkAccessAndRedirect = async () => {
      if (!challenge) return;
      
      try {
        // First, get the user's current experience context
        const experienceContextResponse = await fetch('/api/auth/experience-context');
        const experienceContext = await experienceContextResponse.json();
        
        const response = await fetch(`/api/auth/access-level?challengeId=${challengeId}`);
        const data = await response.json();
        const accessData = data.accessLevel || data;
        
        console.log('🔍 Discover Access check result:', { 
          accessData, 
          experienceContext,
          challenge: challenge?.tenant,
          challengeId,
          userType: accessData.userType,
          isParticipant: accessData.isParticipant,
          userCompanyId: accessData.companyId,
          challengeCompanyId: challenge?.tenant?.whopCompanyId
        });
        
        // Check if user has community access (same company)
        let hasCommunityAccess = false;
        if (challenge && accessData.companyId && challenge.tenant?.whopCompanyId) {
          hasCommunityAccess = accessData.companyId === challenge.tenant.whopCompanyId;
        }
        
        console.log('🏢 DETAILED Community Access Check:', {
          userCompanyId: accessData.companyId,
          challengeCompanyId: challenge.tenant?.whopCompanyId,
          userCompanyIdType: typeof accessData.companyId,
          challengeCompanyIdType: typeof challenge.tenant?.whopCompanyId,
          hasCommunityAccess,
          exactMatch: accessData.companyId === challenge.tenant?.whopCompanyId,
          stringComparison: String(accessData.companyId) === String(challenge.tenant?.whopCompanyId)
        });
        
        // Smart Redirect Logic based on Role + Status
        if (accessData.userType === 'company_owner' && hasCommunityAccess) {
          // Admin → Admin Dashboard
          console.log('👑 Admin detected - redirecting to admin dashboard');
          try {
            router.push(`/admin/c/${challengeId}`);
          } catch (error) {
            console.error('Router error, using window.location:', error);
            window.location.href = `/admin/c/${challengeId}`;
          }
          return;
        } else if (accessData.isParticipant && hasCommunityAccess) {
          // Participant → Challenge Page (same as Feed)
          console.log('🎯 Participant detected - redirecting to challenge page');
          // Try to get experience ID from current context, fallback to company ID
          const experienceId = experienceContext.experienceId || experienceContext.companyId || challenge.tenant?.whopCompanyId;
          console.log('🔗 Redirecting to experience:', { experienceId, challengeId, source: 'participant' });
          try {
            router.push(`/experiences/${experienceId}/c/${challengeId}`);
          } catch (error) {
            console.error('Router error, using window.location:', error);
            window.location.href = `/experiences/${experienceId}/c/${challengeId}`;
          }
          return;
        } else if (hasCommunityAccess && !accessData.isParticipant) {
          // Community Member (not yet participant) → Join Page
          console.log('💡 Community member detected - redirecting to join page');
          // Try to get experience ID from current context, fallback to company ID
          const experienceId = experienceContext.experienceId || experienceContext.companyId || challenge.tenant?.whopCompanyId;
          console.log('🔗 Redirecting to join page:', { experienceId, challengeId, source: 'member' });
          try {
            router.push(`/experiences/${experienceId}/c/${challengeId}`);
          } catch (error) {
            console.error('Router error, using window.location:', error);
            window.location.href = `/experiences/${experienceId}/c/${challengeId}`;
          }
          return;
        } else {
          // Guest or Non-Community Member → Stay on Discover Page
          console.log('🚫 No community access - staying on discover page for monetization');
        }
        
        // For state tracking in UI
        const canAccess = hasCommunityAccess;
        const optimizedUrl = getOptimizedWhopUrlString(challenge.tenant);
        
        setUserAccess({
          access: accessData.userType === 'guest' ? 'no_access' : 'customer',
          user: accessData.userId ? { id: accessData.userId } : null,
          canAccessChallenge: canAccess,
          needsWhopAccess: !canAccess && !!challenge?.tenant.whopCompanyId,
          whopJoinUrl: optimizedUrl
        });
        
        // Note: Removed old state setters as we only need userAccess for UI
        
      } catch (error) {
        console.error('❌ Error checking access:', error);
        // Default to no access
        const optimizedUrl = getOptimizedWhopUrlString(challenge?.tenant);
        
        setUserAccess({
          access: 'no_access',
          canAccessChallenge: false,
          needsWhopAccess: !!challenge?.tenant.whopCompanyId,
          whopJoinUrl: optimizedUrl
        });
      } finally {
        setLoading(false);
      }
    };

    if (challenge) {
      checkAccessAndRedirect();
    }
  }, [challenge, challengeId, router]);

  const handleJoinChallenge = async () => {
    if (!challenge) return;
    
    // If userAccess is still loading, wait
    if (!userAccess) {
      console.log('User access still loading...');
      return;
    }

    console.log('Handle Join Challenge:', {
      userAccess,
      challengeTenant: challenge.tenant,
      canAccessChallenge: userAccess.canAccessChallenge
    });

    // Only community members can join directly
    if (userAccess.canAccessChallenge) {
      console.log('Community member - joining challenge directly...');
      setJoining(true);
      try {
        const response = await fetch(`/api/challenges/${challengeId}/join`, {
          method: 'POST',
        });

        if (response.ok) {
          // Redirect to challenge page (same as Feed)
          try {
            router.push(`/c/${challengeId}`);
          } catch (error) {
            console.error('Router error, using window.location:', error);
            window.location.href = `/c/${challengeId}`;
          }
        } else {
          alert('Error joining challenge');
        }
      } catch (error) {
        console.error('Error joining challenge:', error);
        alert('Error joining challenge');
      } finally {
        setJoining(false);
      }
    } else {
      // Non-community members -> redirect to optimized Whop URL
      const optimizedUrl = getOptimizedWhopUrlString(challenge.tenant);
      
      console.log('🔗 Using optimized Whop URL:', {
        url: optimizedUrl,
        tenantName: challenge.tenant.name
      });
      
      // Show user-friendly message
      const message = generateJoinMessage(challenge.tenant.name || 'this community', true);
      const confirmJoin = confirm(message);
      
      if (confirmJoin) {
        // Track URL optimization for analytics
        trackUrlOptimization('handle_with_product', challenge.tenant.id);
        
        // Open in new tab so user can come back
        window.open(optimizedUrl, '_blank', 'noopener,noreferrer');
        
        // Show contextual success message
        setTimeout(() => {
          const successMessage = 'After joining the community, refresh this page to participate in the challenge!';
          alert(successMessage);
        }, 1000);
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-600';
      case 'intermediate': return 'bg-blue-600';
      case 'advanced': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      fitness: '💪',
      tech: '💻',
      creative: '🎨',
      business: '💼',
      learning: '📚',
      social: '👥',
      gaming: '🎮',
      health: '🏥',
      travel: '✈️',
      personal: '🎯'
    };
    return icons[category as keyof typeof icons] || '🎯';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading challenge...</div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Challenge not found</div>
      </div>
    );
  }

  const getRewardCardStyling = (place: number) => {
    switch (place) {
      case 1:
        return {
          background: 'bg-gradient-to-br from-yellow-600 to-yellow-800',
          badge: 'bg-yellow-500 text-yellow-900',
          text: 'text-yellow-100'
        };
      case 2:
        return {
          background: 'bg-gradient-to-br from-gray-600 to-gray-800',
          badge: 'bg-gray-500 text-gray-900',
          text: 'text-gray-200'
        };
      case 3:
        return {
          background: 'bg-gradient-to-br from-orange-600 to-orange-800',
          badge: 'bg-orange-500 text-orange-900',
          text: 'text-orange-100'
        };
      default:
        return {
          background: 'bg-gradient-to-br from-blue-600 to-blue-800',
          badge: 'bg-blue-500 text-blue-900',
          text: 'text-blue-100'
        };
    }
  };

  const getJoinButtonText = () => {
    console.log('🔍 Button Text Debug:', {
      joining,
      userAccess,
      challengeTenant: challenge?.tenant,
      canAccessChallenge: userAccess?.canAccessChallenge,
      whopCompanyId: challenge?.tenant?.whopCompanyId
    });
    
    if (joining) return 'Joining...';
    
    // Only community members can join directly
    if (userAccess?.canAccessChallenge) {
      return 'Join Free Challenge';
    }
    
    // Everyone else gets redirected to product page (including Default Tenant)
    if (challenge?.tenant?.whopCompanyId) {
      return `Get ${challenge.tenant.name} Access`;
    } else {
      // Default Tenant - also gets Whop redirect
      return 'Get Community Access';
    }
  };

  const getJoinButtonStyle = () => {
    // Community members get blue button (can join directly)
    if (userAccess?.canAccessChallenge) {
      return 'bg-blue-600 hover:bg-blue-500';
    }
    // Everyone else gets purple button (redirects to product page)
    return 'bg-purple-600 hover:bg-purple-500';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <span className="mr-2">←</span>
          Back to Experience
        </button>

        <div className="max-w-6xl mx-auto">
          {/* Challenge Hero Section */}
          <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-2xl p-8 mb-8 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Challenge Image */}
              {challenge.image && (
                <div className="w-full lg:w-80 h-64 lg:h-80 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-blue-600 flex-shrink-0">
                  <Image
                    src={challenge.image}
                    alt={challenge.title}
                    width={320}
                    height={320}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Challenge Content */}
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-white">
                  {challenge.title}
                </h1>
                
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xl">🔥</span>
                  <p className="text-xl text-gray-200 leading-relaxed">
                    <strong>ENTER</strong> the Challenge and send daily proof to <strong>WIN</strong> amazing prizes
                  </p>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🔥</span>
                </div>
                
                {/* Challenge Meta Info */}
                <div className="flex items-center gap-6 text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <span>{new Date(challenge.startAt).toLocaleDateString()} – {new Date(challenge.endAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <span className="capitalize">{challenge.cadence.toLowerCase()} commitment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rewards & Prizes Section */}
          {challenge.rules?.rewards && challenge.rules.rewards.length > 0 && (
            <div className="mb-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <span>Rewards & Prizes</span>
                </h2>
              </div>
              
              {/* Dynamic Reward Cards */}
              <div className={`grid gap-6 mb-8 ${
                challenge.rules.rewards.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' :
                challenge.rules.rewards.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
                'md:grid-cols-3'
              }`}>
                {challenge.rules.rewards
                  .sort((a, b) => a.place - b.place)
                  .map((reward, index) => {
                    const styling = getRewardCardStyling(reward.place);
                    return (
                      <div 
                        key={`reward-${reward.place}-${index}`}
                        className={`${styling.background} rounded-2xl p-6 text-center relative`}
                      >
                        <div className={`absolute top-4 left-4 ${styling.badge} px-3 py-1 rounded-full text-sm font-bold`}>
                          #{reward.place}
                        </div>
                        <h3 className="text-xl font-bold mb-2 mt-4 text-white">
                          {reward.title}
                        </h3>
                        {reward.desc && (
                          <p className={styling.text}>
                            {reward.desc}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Challenge Info & Join Section */}
          <div className="bg-gray-800 rounded-2xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl">ℹ️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Challenge starts on {new Date(challenge.startAt).toLocaleDateString()}
                  </h3>
                  <p className="text-gray-400">
                    {Math.ceil((new Date(challenge.endAt).getTime() - new Date(challenge.startAt).getTime()) / (1000 * 60 * 60 * 24))} days • {challenge._count.enrollments} participants
                  </p>
                </div>
              </div>
              
              {/* Join Button */}
              <button
                onClick={handleJoinChallenge}
                disabled={joining}
                className={`${getJoinButtonStyle()} disabled:opacity-50 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 text-lg flex items-center gap-2 hover:shadow-lg`}
              >
                <span className="text-xl">🚀</span>
                {getJoinButtonText()}
              </button>
            </div>
          </div>

          {/* Bottom Info Sections */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Challenge Yourself */}
            <div className="bg-gray-800 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Challenge Yourself</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Join a community of motivated individuals working towards their goals. 
                Track your progress and stay accountable with daily check-ins.
              </p>
            </div>

            {/* Earn Recognition */}
            <div className="bg-gray-800 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Earn Recognition</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Complete the challenge to earn your spot on the leaderboard 
                and gain recognition for your dedication and consistency.
              </p>
            </div>
          </div>

          {/* Access Info for Non-Members */}
          {!userAccess?.canAccessChallenge && (
            <div className="mt-8 bg-gray-800 border border-gray-700 rounded-2xl p-6">
              <div className="text-center">
                <h4 className="text-white font-semibold mb-2 text-xl">🔒 Community Access Required</h4>
                <p className="text-gray-300 mb-2">
                  This <strong>challenge</strong> is exclusive to community members.
                </p>
                <p className="text-gray-400 text-sm">
                  💰 Get community access to join challenges and compete for prizes
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
