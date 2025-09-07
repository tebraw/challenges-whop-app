"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

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
        
        if (data.challenges && data.challenges.length > 0) {
          setChallenge(data.challenges[0]);
        }
      } catch (error) {
        console.error('Error fetching challenge:', error);
      }
    };

    if (challengeId) {
      fetchChallenge();
    }
  }, [challengeId]);

  // Check user access level
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/auth/access-level');
        const accessData = await response.json();
        
        // If user has access, check if they can access this specific challenge
        if (accessData.access !== 'no_access' && challenge) {
          const challengeResponse = await fetch(`/api/challenges/${challengeId}`);
          const canAccess = challengeResponse.ok;
          
          setUserAccess({
            ...accessData,
            canAccessChallenge: canAccess,
            needsWhopAccess: !canAccess && challenge.tenant.whopCompanyId,
            whopJoinUrl: challenge.tenant.whopCompanyId ? 
              `https://whop.com/company/${challenge.tenant.whopCompanyId}` : undefined
          });
        } else {
          // Guest user or no access
          setUserAccess({
            access: 'no_access',
            canAccessChallenge: false,
            needsWhopAccess: challenge?.tenant.whopCompanyId ? true : false,
            whopJoinUrl: challenge?.tenant.whopCompanyId ? 
              `https://whop.com/company/${challenge.tenant.whopCompanyId}` : undefined
          });
        }
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setLoading(false);
      }
    };

    if (challenge) {
      checkAccess();
    }
  }, [challenge, challengeId]);

  const handleJoinChallenge = async () => {
    if (!challenge || !userAccess) return;

    // If user needs Whop access, redirect to community
    if (userAccess.needsWhopAccess && userAccess.whopJoinUrl) {
      window.open(userAccess.whopJoinUrl, '_blank');
      return;
    }

    // If user can access, join the challenge
    if (userAccess.canAccessChallenge) {
      setJoining(true);
      try {
        const response = await fetch(`/api/challenges/${challengeId}/join`, {
          method: 'POST',
        });

        if (response.ok) {
          // Redirect to challenge participation page
          router.push(`/c/${challengeId}/participate`);
        } else {
          alert('Fehler beim Beitreten der Challenge');
        }
      } catch (error) {
        console.error('Error joining challenge:', error);
        alert('Fehler beim Beitreten der Challenge');
      } finally {
        setJoining(false);
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
        <div className="text-white text-lg">Lade Challenge...</div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Challenge nicht gefunden</div>
      </div>
    );
  }

  const getJoinButtonText = () => {
    if (joining) return 'Wird beigetreten...';
    if (userAccess?.needsWhopAccess) return `${challenge.tenant.name} Community beitreten`;
    if (userAccess?.canAccessChallenge) return 'Challenge beitreten';
    return 'Zur Community';
  };

  const getJoinButtonStyle = () => {
    if (userAccess?.needsWhopAccess) {
      return 'bg-purple-600 hover:bg-purple-500';
    }
    return 'bg-blue-600 hover:bg-blue-500';
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
          Zurück zum Marketplace
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
                von <span className="font-semibold text-blue-400">{challenge.tenant.name}</span>
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
                  <h3 className="font-semibold text-white mb-2">🗓️ Zeitraum</h3>
                  <p className="text-gray-300 text-sm">
                    {new Date(challenge.startAt).toLocaleDateString('de-DE')} - {' '}
                    {new Date(challenge.endAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">🔄 Häufigkeit</h3>
                  <p className="text-gray-300 text-sm capitalize">
                    {challenge.cadence.toLowerCase()}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">📋 Nachweis</h3>
                  <p className="text-gray-300 text-sm">
                    {challenge.proofType === 'IMAGE' ? 'Bild' : 
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
                
                {userAccess?.needsWhopAccess && (
                  <div className="flex-1 bg-gray-700 rounded-lg p-4">
                    <div className="text-center">
                      <h4 className="text-white font-semibold mb-2">🔒 Community-Zugang erforderlich</h4>
                      <p className="text-gray-300 text-sm">
                        Tritt der <strong>{challenge.tenant.name}</strong> Community bei, um an dieser Challenge teilzunehmen.
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
