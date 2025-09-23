import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk-unified';
import { prisma } from '@/lib/prisma';
import CustomerChallenges from './components/CustomerChallenges';
import NotificationBadge from '@/components/NotificationBadge';

interface Props {
  params: Promise<{
    experienceId: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function ExperiencePage({ params }: Props) {
  const { experienceId } = await params;
  
  console.log('🎭 Experience Page for:', experienceId);
  
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
    
    console.log('✅ Experience access verified for user:', userId);
    
    // Get or create user in our system
    let user = await prisma.user.findUnique({
      where: { whopUserId: userId },
      include: { tenant: true }
    });
    
    if (!user) {
      console.log('👤 Creating new user for experience:', userId);
      
      // 🚨 USE AUTOMATIC COMPANY ID EXTRACTION - NO FALLBACKS!
      // Get or create user in our system with auto-extracted company ID
      const { autoCreateOrUpdateUser } = await import('@/lib/auto-company-extraction');
      const createdUser = await autoCreateOrUpdateUser(userId, experienceId, null);
      
      // Fetch the complete user with relations
      user = await prisma.user.findUnique({
        where: { whopUserId: userId },
        include: { tenant: true }
      });
      
      if (!user) {
        throw new Error('Failed to create or find user');
      }
    }
    
    // Get the user's tenant/company ID for proper challenge filtering
    console.log('🏢 User tenant info:', {
      userId: user.id,
      tenantId: user.tenantId,
      whopCompanyId: user.tenant?.whopCompanyId
    });
    
    // Filter challenges by the user's tenant/company
    // This ensures members see challenges from their own community
    // Exclude challenges that have already ended
    const challenges = await prisma.challenge.findMany({
      where: {
        AND: [
          { tenantId: user.tenantId },  // Show challenges from user's tenant/company
          {
            endAt: {
              gt: new Date()  // Only show challenges that haven't ended yet
            }
          }
        ]
      },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        },
        enrollments: {
          where: {
            userId: user.id
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('📊 Found challenges for user:', {
      challengeCount: challenges.length,
      userTenantId: user.tenantId,
      challengeTenantIds: challenges.map(c => ({ id: c.id, title: c.title, tenantId: c.tenantId }))
    });
    
    // Calculate user statistics
    const joinedChallengesCount = challenges.filter((c: any) => c.enrollments && c.enrollments.length > 0).length;
    
    return (
      <div className="min-h-screen bg-gray-900">
        {/* Experience Header with Navigation */}
        <header className="bg-gray-800/50 border-b border-gray-700 sticky top-0 z-40 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo/Title */}
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-white">Experience</h1>
              </div>
              
              {/* Navigation Items */}
              <div className="flex items-center gap-4">
                {/* Notification Badge */}
                <NotificationBadge userId={user.id} />
                
                {/* User Info */}
                <div className="text-sm text-gray-300">
                  {whopUser?.username || whopUser?.name || 'Member'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Beautiful Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full px-6 py-3 mb-6">
              <span className="text-3xl">🎯</span>
              <h1 className="text-2xl font-bold text-white">Community Challenges</h1>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Transform your habits, achieve your goals, and connect with an amazing community! 🚀
            </p>
          </div>
          
          {/* Beautiful Stats Dashboard */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="group bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6 text-center hover:border-blue-400/40 transition-all duration-300">
              <div className="text-4xl mb-3">💪</div>
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {joinedChallengesCount}
              </div>
              <div className="text-gray-300 font-medium">Active Challenges</div>
            </div>
            <div className="group bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-2xl p-6 text-center hover:border-yellow-400/40 transition-all duration-300">
              <div className="text-4xl mb-3">🏆</div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                0
              </div>
              <button 
                onClick={() => {
                  // Open wins modal
                  const modal = document.createElement('div');
                  modal.innerHTML = `
                    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="this.remove()">
                      <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4" onclick="event.stopPropagation()">
                        <div class="flex items-center justify-between mb-4">
                          <h3 class="text-xl font-bold text-white">🏆 Deine Wins</h3>
                          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div class="text-gray-300 text-center py-8">
                          <div class="text-4xl mb-4">🎉</div>
                          <p>Du hast noch keine Wins!</p>
                          <p class="text-sm text-gray-400 mt-2">Schließe Challenges ab, um hier deine Benachrichtigungen zu sehen.</p>
                        </div>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(modal);
                }}
                className="text-yellow-400 font-medium hover:text-yellow-300 transition-colors"
              >
                Wins
              </button>
            </div>
            <div className="group bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-6 text-center hover:border-purple-400/40 transition-all duration-300">
              <div className="text-4xl mb-3">🔥</div>
              <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
              <div className="text-gray-300 font-medium">Current Streak</div>
            </div>
          </div>
          
          {/* Challenges List */}
          <CustomerChallenges 
            experienceId={experienceId}
            user={user}
            whopUser={whopUser}
            initialChallenges={challenges}
          />
        </div>
      </div>
    );
    
  } catch (error) {
    console.error('Experience page error:', error);
    
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
