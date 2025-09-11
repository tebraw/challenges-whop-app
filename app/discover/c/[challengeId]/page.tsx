"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getOptimizedWhopUrl, generateJoinMessage, trackUrlOptimization } from "@/lib/whop-url-optimizer";

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
        const response = await fetch(`/api/auth/access-level?challengeId=${challengeId}`);
        const data = await response.json();
        const accessData = data.accessLevel || data;
        
        console.log('🔍 Discover Access check result:', { 
          accessData, 
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
          try {
            router.push(`/c/${challengeId}`);
          } catch (error) {
            console.error('Router error, using window.location:', error);
            window.location.href = `/c/${challengeId}`;
          }
          return;
        } else if (hasCommunityAccess && !accessData.isParticipant) {
          // Community Member (not yet participant) → Join Page
          console.log('💡 Community member detected - redirecting to join page');
          try {
            router.push(`/c/${challengeId}`);
          } catch (error) {
            console.error('Router error, using window.location:', error);
            window.location.href = `/c/${challengeId}`;
          }
          return;
        } else {
          // Guest or Non-Community Member → Stay on Discover Page
          console.log('🚫 No community access - staying on discover page for monetization');
        }
        
        // For state tracking in UI
        const canAccess = hasCommunityAccess;
        const optimizedUrlInfo = getOptimizedWhopUrl({
          name: challenge.tenant.name,
          whopCompanyId: challenge.tenant.whopCompanyId
        });
        
        setUserAccess({
          access: accessData.userType === 'guest' ? 'no_access' : 'customer',
          user: accessData.userId ? { id: accessData.userId } : null,
          canAccessChallenge: canAccess,
          needsWhopAccess: !canAccess && !!challenge?.tenant.whopCompanyId,
          whopJoinUrl: optimizedUrlInfo.url
        });
        
        // Note: Removed old state setters as we only need userAccess for UI
        
      } catch (error) {
        console.error('❌ Error checking access:', error);
        // Default to no access
        const optimizedUrlInfo = getOptimizedWhopUrl({
          name: challenge?.tenant.name,
          whopCompanyId: challenge?.tenant.whopCompanyId
        });
        
        setUserAccess({
          access: 'no_access',
          canAccessChallenge: false,
          needsWhopAccess: !!challenge?.tenant.whopCompanyId,
          whopJoinUrl: optimizedUrlInfo.url
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
      const { url: optimizedUrl, isOptimized, type } = getOptimizedWhopUrl({
        name: challenge.tenant.name,
        whopCompanyId: challenge.tenant.whopCompanyId
      });
      
      console.log('🔗 Using optimized Whop URL:', {
        url: optimizedUrl,
        isOptimized,
        type,
        tenantName: challenge.tenant.name
      });
      
      // Show user-friendly message with URL type awareness
      const message = generateJoinMessage(challenge.tenant.name || 'this community', isOptimized);
      const confirmJoin = confirm(message);
      
      if (confirmJoin) {
        // Track URL optimization for analytics
        trackUrlOptimization(type, challenge.tenant.id);
        
        // Open in new tab so user can come back
        window.open(optimizedUrl, '_blank', 'noopener,noreferrer');
        
        // Show contextual success message
        setTimeout(() => {
          const successMessage = isOptimized 
            ? 'After joining the community, refresh this page to participate in the challenge!'
            : 'After joining via Whop, come back here to participate in the challenge!';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <span className="mr-2">←</span>
          Back to Marketplace
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Challenge Header */}
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
            {challenge.image && (
              <div className="relative h-64 md:h-80">
                <Image
                  src={challenge.image}
                  alt={challenge.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            <div className="p-6">
              {/* Challenge Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="flex items-center px-3 py-1 bg-gray-700 rounded-full text-sm">
                  {getCategoryIcon(challenge.category)}
                  <span className="ml-2 capitalize">{challenge.category}</span>
                </span>
                <span className={`px-3 py-1 rounded-full text-white text-sm ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </span>
                <span className="px-3 py-1 bg-blue-600 rounded-full text-white text-sm">
                  {challenge._count.enrollments} Teilnehmer
                </span>
              </div>

              {/* Title and Company */}
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {challenge.title}
              </h1>
              <p className="text-lg text-gray-300 mb-6">
                by <span className="font-semibold text-blue-400">{challenge.tenant.name}</span>
              </p>

              {/* Description */}
              <div className="prose prose-lg prose-invert max-w-none mb-8">
                <p className="text-gray-300 leading-relaxed">
                  {challenge.description}
                </p>
              </div>

              {/* Challenge Details */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">🗓️ Duration</h3>
                  <p className="text-gray-300 text-sm">
                    {new Date(challenge.startAt).toLocaleDateString('en-US')} - {' '}
                    {new Date(challenge.endAt).toLocaleDateString('en-US')}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">🔄 Frequency</h3>
                  <p className="text-gray-300 text-sm capitalize">
                    {challenge.cadence.toLowerCase()}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">📋 Proof Type</h3>
                  <p className="text-gray-300 text-sm">
                    {challenge.proofType === 'IMAGE' ? 'Image' : 
                     challenge.proofType === 'TEXT' ? 'Text' : 'Video'}
                  </p>
                </div>
              </div>

              {/* Join Button */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleJoinChallenge}
                  disabled={joining}
                  className={`flex-1 ${getJoinButtonStyle()} disabled:opacity-50 text-white font-semibold py-4 px-8 rounded-lg transition-colors text-lg`}
                >
                  {getJoinButtonText()}
                </button>
                
                {/* Info box for non-community members (including Default Tenant) */}
                {!userAccess?.canAccessChallenge && (
                  <div className="flex-1 bg-gray-700 rounded-lg p-4">
                    <div className="text-center">
                      <h4 className="text-white font-semibold mb-2">🔒 Community Access Required</h4>
                      <p className="text-gray-300 text-sm mb-2">
                        This <strong>free challenge</strong> is exclusive to community members.
                      </p>
                      <p className="text-gray-400 text-xs">
                        💰 Get community access to join challenges
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
