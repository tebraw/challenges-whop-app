import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk-unified';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, Users, Trophy, Star, Clock, Award } from 'lucide-react';

interface Props {
  params: Promise<{
    experienceId: string;
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

export default async function DiscoverExperiencePage({ params }: Props) {
  const { experienceId } = await params;
  
  console.log('🔍 Experience Discover Page for:', experienceId);
  
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
    
    // Always sync user to current experience/company context
    const { autoCreateOrUpdateUser } = await import('@/lib/auto-company-extraction');
    await autoCreateOrUpdateUser(userId, experienceId, null);

    // Fetch the user's tenant info for proper challenge categorization
    const user = await prisma.user.findUnique({
      where: { whopUserId: userId },
      include: { tenant: true }
    });

    console.log('🔍 Discover - User tenant info:', {
      userId: user?.id,
      tenantId: user?.tenantId,
      whopCompanyId: user?.tenant?.whopCompanyId
    });

    // Get ALL public challenges from ALL communities (including own community)
    // Exclude challenges that have already ended
    const allChallenges = await prisma.challenge.findMany({
      where: {
        AND: [
          { isPublic: true },  // Show ALL public challenges
          {
            endAt: {
              gt: new Date()  // Only show challenges that haven't ended yet
            }
          }
        ]
      },
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
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50  // Limit for performance
    });

    console.log(`🔍 Found ${allChallenges.length} cross-community challenges`);
    
    // Fetch real company names for all challenges
    const challengesWithCompanyNames = await Promise.all(
      allChallenges.map(async (challenge) => {
        if (challenge.tenant?.whopCompanyId) {
          const realCompanyName = await getCompanyName(challenge.tenant.whopCompanyId);
          return {
            ...challenge,
            tenant: {
              ...challenge.tenant,
              realName: realCompanyName
            }
          };
        }
        return challenge;
      })
    );
    
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Beautiful Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-full px-6 py-3 mb-6">
              <span className="text-3xl">🔍</span>
              <h1 className="text-2xl font-bold text-white">Discover Challenges</h1>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Explore amazing challenges from communities across the platform! 🌟
            </p>
            
            {/* Tab Navigation */}
            <div className="flex gap-4 justify-center mt-6">
              <Link 
                href={`/experiences/${experienceId}`}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                My Challenges
              </Link>
              <div className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium">
                🔍 Discover All
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6 mb-8 text-center">
            <div className="text-4xl mb-3">🌍</div>
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {challengesWithCompanyNames.length}
            </div>
            <div className="text-gray-300 font-medium">Communities to Explore</div>
          </div>
          
          {/* Challenges Grid */}
          {challengesWithCompanyNames.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No challenges found</h3>
              <p className="text-gray-400">
                Come back later to discover amazing challenges from other communities!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challengesWithCompanyNames.map((challenge: any) => {
                const status = new Date() < new Date(challenge.startAt) ? 'upcoming' : 
                              new Date() > new Date(challenge.endAt) ? 'ended' : 'active';
                
                const statusColor = status === 'upcoming' ? 'text-blue-400' : 
                                   status === 'ended' ? 'text-gray-400' : 'text-green-400';
                
                const statusIcon = status === 'upcoming' ? <Clock className="h-4 w-4" /> : 
                                  status === 'ended' ? <Trophy className="h-4 w-4" /> : 
                                  <Star className="h-4 w-4" />;

                // Check if this challenge is from user's own community
                const isOwnCommunity = challenge.tenantId === user?.tenantId;
                const actionText = isOwnCommunity ? "Open Challenge" : "Join Community First";
                const actionIcon = isOwnCommunity ? "🚀" : "🏢";

                return (
                  <div
                    key={challenge.id}
                    className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-orange-500/50 transition-all duration-300"
                  >
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-orange-500/50 transition-all duration-300 group-hover:transform group-hover:scale-[1.02]">
                      {/* Challenge Image */}
                      <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                        {challenge.imageUrl ? (
                          <img 
                            src={challenge.imageUrl} 
                            alt={challenge.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl">🎯</span>
                        )}
                      </div>
                      
                      {/* Challenge Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`flex items-center gap-1 text-xs font-medium ${statusColor}`}>
                            {statusIcon}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </div>
                          {challenge.featured && (
                            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                              ⭐ Featured
                            </span>
                          )}
                          {isOwnCommunity && (
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                              ✅ Your Community
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-bold text-white text-lg mb-2 hover:text-orange-400 transition-colors">
                          {challenge.title}
                        </h3>
                        
                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                          {challenge.description}
                        </p>
                        
                        {/* Community Info */}
                        <div className={`rounded-lg p-3 mb-4 ${isOwnCommunity ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-700/50'}`}>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={isOwnCommunity ? "text-green-400" : "text-orange-400"}>🏢</span>
                            <span className="text-gray-300 font-medium">
                              {challenge.tenant?.realName || challenge.tenant?.name || 'Community'}
                            </span>
                            {isOwnCommunity && (
                              <span className="text-green-400 text-xs">(Your Community)</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{challenge._count?.enrollments || 0} participants</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(challenge.startAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          {isOwnCommunity ? (
                            <Link
                              href={`/experiences/${experienceId}/c/${challenge.id}`}
                              className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                            >
                              🚀 Open Challenge
                            </Link>
                          ) : (
                            <Link
                              href={`/experiences/${experienceId}/discover/${challenge.id}`}
                              className="inline-flex items-center justify-center w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors border border-gray-600"
                            >
                              🏢 View Details & Join Community
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Back to Community */}
          <div className="mt-12 text-center">
            <Link 
              href={`/experiences/${experienceId}`}
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-colors border border-gray-600"
            >
              ← Back to Your Community
            </Link>
          </div>
        </div>
      </div>
    );
    
  } catch (error) {
    console.error('Experience discover page error:', error);
    
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