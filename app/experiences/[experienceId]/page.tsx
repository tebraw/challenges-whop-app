import { headers } from 'next/headers';
import { whopSdk } from '@/lib/whop-sdk';
import { prisma } from '@/lib/prisma';
import CustomerChallenges from './components/CustomerChallenges';

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
      where: { whopUserId: userId }
    });
    
    if (!user) {
      console.log('👤 Creating new user for experience:', userId);
      
      // 🚨 USE AUTOMATIC COMPANY ID EXTRACTION - NO FALLBACKS!
      // Get or create user in our system with auto-extracted company ID
      const { autoCreateOrUpdateUser } = await import('@/lib/auto-company-extraction');
      user = await autoCreateOrUpdateUser(userId, experienceId, null);
    }
    
    // Find the company/creator associated with this experience
    // For now, we'll show all challenges, but this should be filtered by the experience's company
    const challenges = await prisma.challenge.findMany({
      where: {
        // TODO: Filter by experience's company when we have that mapping
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
    
    // Calculate user statistics
    const joinedChallengesCount = challenges.filter((c: any) => c.enrollments && c.enrollments.length > 0).length;
    
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              🎯 Community Challenges
            </h1>
            <p className="text-gray-400">
              Join challenges and track your progress with the community
            </p>
          </div>
          
          {/* User Dashboard */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {joinedChallengesCount}
              </div>
              <div className="text-gray-400">Joined Challenges</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                0
              </div>
              <div className="text-gray-400">Completed</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
              <div className="text-gray-400">Current Streak</div>
            </div>
          </div>
          
          {/* Challenges List */}
          <CustomerChallenges 
            experienceId={experienceId}
            user={user}
            whopUser={null}
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
