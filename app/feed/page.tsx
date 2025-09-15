import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Calendar, Users, Trophy, Gift } from "lucide-react";
import Button from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";

// Mark this page as dynamic since it requires authentication
export const dynamic = 'force-dynamic';

type Challenge = {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  imageUrl?: string;
  _count?: { enrollments: number };
};

export default async function FeedPage() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Required</h1>
            <p className="text-gray-400">Please access this app through Whop.</p>
          </div>
        </div>
      );
    }

    const experienceId = user.whopCompanyId;
    
    // Fetch challenges for this user's experience from database
    let challenges: Challenge[] = [];
    try {
      if (experienceId) {
        const challengeData = await prisma.challenge.findMany({
          where: {
            tenant: {
              whopCompanyId: experienceId
            }
          },
          include: {
            _count: {
              select: {
                enrollments: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        challenges = challengeData.map((challenge: any) => ({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description || undefined,
          startAt: challenge.startAt.toISOString(),
          endAt: challenge.endAt.toISOString(),
          imageUrl: challenge.image || undefined,
          _count: challenge._count
        }));
        
        console.log('📱 Feed loaded challenges:', challenges.length);
      }
    } catch (error) {
      console.error('Error fetching challenges for feed:', error);
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Community Challenges
              </h1>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join challenges and track your progress with the community
            </p>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="text-3xl font-bold text-blue-400 mb-2">0</div>
                <div className="text-gray-400">Joined Challenges</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="text-3xl font-bold text-green-400 mb-2">0</div>
                <div className="text-gray-400">Completed</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
                <div className="text-gray-400">Current Streak</div>
              </div>
            </div>
          </div>
          
          {/* My Feed Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">My Feed</h2>
            <p className="text-gray-400">Challenges from creators you follow and participate in</p>
          </div>

          {challenges.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-800 rounded-xl p-12 max-w-lg mx-auto border border-gray-700">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📋</span>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-white">No challenges yet</h2>
                <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                  Challenges from creators you follow will appear here. 
                  <br />Check back later for new exciting challenges!
                </p>
                <div className="inline-flex items-center gap-2 text-purple-400 font-medium">
                  <span className="text-lg">✨</span>
                  <span>New challenges coming soon</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="hover:shadow-lg transition-all duration-300 hover:shadow-purple-500/20 border-gray-700 hover:border-gray-600">
                  <div className="flex gap-6">
                    {/* Challenge Image */}
                    {challenge.imageUrl && (
                      <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-blue-600 flex-shrink-0">
                        <img 
                          src={challenge.imageUrl} 
                          alt={challenge.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Challenge Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2 truncate">
                            {challenge.title}
                          </h3>
                          
                          {challenge.description && (
                            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                              {challenge.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Challenge Info */}
                      <div className="flex flex-wrap items-center gap-6 text-sm mb-4">
                        <div className="flex items-center gap-2 text-blue-400">
                          <span className="text-lg">📅</span>
                          <span className="font-medium">
                            {new Date(challenge.startAt).toLocaleDateString()} - {new Date(challenge.endAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {challenge._count && (
                          <div className="flex items-center gap-2 text-green-400">
                            <span className="text-lg">👥</span>
                            <span className="font-medium">{challenge._count.enrollments} participants</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-yellow-400">
                          <span className="text-lg">🏆</span>
                          <span className="font-medium">Rewards available</span>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="flex justify-end">
                        <Link href={`/discover/c/${challenge.id}`}>
                          <Button 
                            variant="primary" 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
                          >
                            Open Challenge
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error loading feed:', error);
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-8">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
}
