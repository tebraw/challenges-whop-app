import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk-unified';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, Users, Trophy, Star, Clock, Award, ArrowLeft, Gift } from 'lucide-react';
import JoinCommunityButton from '@/components/experiences/JoinCommunityButton';

interface Props {
  params: Promise<{
    experienceId: string;
    challengeId: string;
  }>;
}

export const dynamic = 'force-dynamic';

// Helper function to fetch real company names from Whop API
async function getCompanyName(whopCompanyId: string): Promise<string> {
  try {
    const companyDetails = await whopSdk.companies.getCompany({
      companyId: whopCompanyId
    });
    return companyDetails.title || whopCompanyId;
  } catch (error) {
    console.log(`⚠️ Could not fetch company name for ${whopCompanyId}:`, error);
    return whopCompanyId; // Fallback to company ID
  }
}

export default async function ExperienceDiscoverChallengePage({ params }: Props) {
  const { experienceId, challengeId } = await params;
  
  console.log('🔍 Experience Discover Challenge:', { experienceId, challengeId });
  
  try {
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
    
    // Verify user access to this experience
    const { userId } = await whopSdk.verifyUserToken(headersList);
    
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
    
    // Get the challenge (from external community)
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            whopCompanyId: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    if (!challenge) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Challenge Not Found</h1>
            <p className="text-gray-400">This challenge may have been removed.</p>
            <Link 
              href={`/experiences/${experienceId}/discover`}
              className="inline-block mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              ← Back to Discover
            </Link>
          </div>
        </div>
      );
    }

    // Fetch real company name
    let realCompanyName = challenge.tenant?.name || 'Community';
    if (challenge.tenant?.whopCompanyId) {
      realCompanyName = await getCompanyName(challenge.tenant.whopCompanyId);
    }

    // Check if this is from a different community
    const isExternalCommunity = challenge.tenant?.whopCompanyId !== experienceId;
    
    if (!isExternalCommunity) {
      // If it's from the same community, redirect to regular challenge page
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
            <p className="text-gray-400">This challenge is from your community.</p>
            <script dangerouslySetInnerHTML={{
              __html: `window.location.href = '/experiences/${experienceId}/c/${challengeId}';`
            }} />
          </div>
        </div>
      );
    }

    const status = new Date() < new Date(challenge.startAt) ? 'upcoming' : 
                  new Date() > new Date(challenge.endAt) ? 'ended' : 'active';
    
    const statusColor = status === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                       status === 'ended' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 
                       'bg-green-500/20 text-green-400 border-green-500/30';
    
    const statusIcon = status === 'upcoming' ? <Clock className="h-4 w-4" /> : 
                      status === 'ended' ? <Trophy className="h-4 w-4" /> : 
                      <Star className="h-4 w-4" />;

    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Back Button */}
          <Link 
            href={`/experiences/${experienceId}/discover`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discover
          </Link>
          
          {/* Challenge Hero */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden mb-8">
            {/* Challenge Image */}
            <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
              {challenge.imageUrl ? (
                <img 
                  src={challenge.imageUrl} 
                  alt={challenge.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl">🎯</span>
              )}
            </div>
            
            {/* Challenge Details */}
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
                  {statusIcon}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
                {challenge.featured && (
                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium border border-yellow-500/30">
                    ⭐ Featured
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                {challenge.title}
              </h1>
              
              <p className="text-gray-300 text-lg mb-6">
                {challenge.description}
              </p>
              
              {/* Community Info */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏢</span>
                  <div>
                    <h3 className="text-white font-semibold">From Community</h3>
                    <p className="text-orange-400 font-medium">
                      {realCompanyName}
                    </p>
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
                  <p className="text-red-400 text-sm font-medium">
                    ⚠️ This challenge is from a different community. You'll need to join their community first to participate.
                  </p>
                </div>
              </div>
              
              {/* Challenge Rewards Preview */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">� Rewards & Prizes</h3>
                  <p className="text-gray-300 mb-6">
                    See what you can win when you participate in this challenge!
                  </p>
                  
                  {/* Show actual challenge rewards */}
                  {challenge?.rules && 
                   typeof challenge.rules === 'object' && 
                   challenge.rules !== null &&
                   'rewards' in challenge.rules && 
                   Array.isArray((challenge.rules as any).rewards) && 
                   (challenge.rules as any).rewards.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {(challenge.rules as any).rewards.map((reward: any, index: number) => (
                        <div 
                          key={index}
                          className="bg-gray-800/50 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-400/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center text-2xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎁'}
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">
                                {reward.title || reward.name || `Reward #${index + 1}`}
                              </h4>
                              {reward.place && (
                                <p className="text-yellow-400 text-sm">#{reward.place} Place</p>
                              )}
                            </div>
                          </div>
                          
                          {reward.description && (
                            <p className="text-gray-300 text-sm mb-4">{reward.description}</p>
                          )}
                          
                          <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                            <Gift className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
                            <p className="text-yellow-300 text-sm font-medium">Win this prize!</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium mb-2">Mystery Prizes Await!</p>
                      <p className="text-sm">Join this community to discover what you can win</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">
                    {challenge._count?.enrollments || 0}
                  </div>
                  <div className="text-gray-400 text-sm">Participants</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <Calendar className="h-6 w-6 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">
                    {new Date(challenge.startAt).toLocaleDateString()}
                  </div>
                  <div className="text-gray-400 text-sm">Start Date</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">
                    {new Date(challenge.endAt).toLocaleDateString()}
                  </div>
                  <div className="text-gray-400 text-sm">End Date</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Primary Action: Join Community */}
                <JoinCommunityButton 
                  challengeId={challengeId}
                  challengeTitle={challenge.title}
                  creatorName={realCompanyName}
                />
                
                {/* Secondary Action: Learn More */}
                <button className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors border border-gray-600">
                  📚 Learn More About Community
                </button>
              </div>
              
              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mt-6">
                <h4 className="text-blue-400 font-semibold mb-2">💡 How it works:</h4>
                <ol className="text-gray-300 space-y-2 text-sm">
                  <li>1. Join the community that created this challenge</li>
                  <li>2. Get access to their exclusive challenges and content</li>
                  <li>3. Participate and connect with like-minded people</li>
                  <li>4. Track your progress and earn rewards</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    
  } catch (error) {
    console.error('Experience discover challenge error:', error);
    
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-400">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
}