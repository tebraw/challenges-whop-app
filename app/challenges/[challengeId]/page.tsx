import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// Mock challenge data for development
const mockChallenge = {
  id: 'cmf7lrtlq000314ehs17u67jy',
  title: '30-Day Fitness Challenge',
  description: 'Transform your fitness in 30 days with daily workouts, nutrition tips, and community support. Join thousands of others on this journey!',
  imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
  category: 'Fitness',
  startAt: new Date('2025-09-01'),
  endAt: new Date('2025-09-30'),
  isActive: true,
  proofType: 'PHOTO',
  rules: {
    minParticipants: 10,
    maxParticipants: 100,
    dailyCheckIn: true,
    rewards: {
      first: '🏆 500€ Cash + Premium Gym Membership',
      second: '🥈 300€ Gift Card + Fitness Tracker',
      third: '🥉 100€ Store Credit + Workout Gear'
    },
    requirements: [
      'Complete daily 30-minute workout',
      'Upload photo proof of exercise',
      'Maintain minimum 80% check-in rate',
      'Follow community guidelines'
    ]
  },
  _count: { 
    enrollments: 42 
  }
};

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const user = await getCurrentUser();

  // Development mode - use mock data
  if (process.env.NODE_ENV === 'development') {
    const challenge = { ...mockChallenge, id: challengeId };
    
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium mb-4">
                  {challenge.category} Challenge
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                  {challenge.title}
                </h1>
                <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                  {challenge.description}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-300">Participants</div>
                    <div className="text-2xl font-bold">{challenge._count.enrollments}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-300">Duration</div>
                    <div className="text-2xl font-bold">30 Days</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-300">Status</div>
                    <div className="text-2xl font-bold text-green-400">Active</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img
                  src={challenge.imageUrl}
                  alt={challenge.title}
                  className="w-full h-80 lg:h-96 object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="py-16 bg-gray-800/50">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold text-center mb-12">🏆 Amazing Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">1st Place</h3>
                <p className="text-gray-800">{challenge.rules.rewards.first}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
                <div className="text-6xl mb-4">🥈</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">2nd Place</h3>
                <p className="text-gray-800">{challenge.rules.rewards.second}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
                <div className="text-6xl mb-4">🥉</div>
                <h3 className="text-xl font-bold text-white mb-2">3rd Place</h3>
                <p className="text-gray-200">{challenge.rules.rewards.third}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Ready to Transform Your Life?</h2>
            <p className="text-xl text-gray-400 mb-8">
              Join {challenge._count.enrollments} others who are already on their journey to success!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={`/challenges/${challenge.id}/participate`}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                🚀 Join Challenge
              </Link>
              <Link 
                href="/discover"
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors border border-gray-600"
              >
                Explore More Challenges
              </Link>
            </div>
          </div>
        </div>

        {/* Requirements Section */}
        <div className="py-16 bg-gray-800/30">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl font-bold text-center mb-12">📋 Challenge Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {challenge.rules.requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-4 bg-gray-800 rounded-xl p-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <span className="text-gray-200">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Don't Wait - Start Today!</h2>
            <p className="text-xl text-blue-100 mb-8">
              Every day you wait is a day you could be closer to your goals.
            </p>
            <Link 
              href={`/challenges/${challenge.id}/participate`}
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-xl text-lg transition-colors shadow-lg inline-block"
            >
              💪 Start Your Journey Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Production mode - fetch from database
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
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
            <h1 className="text-4xl font-bold mb-4">Challenge Not Found</h1>
            <p className="text-gray-400 mb-8">The challenge you're looking for doesn't exist.</p>
            <Link 
              href="/discover"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Discover Challenges
            </Link>
          </div>
        </div>
      );
    }

    // Similar structure as development mode but with real data
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Real implementation would go here */}
        <div className="py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">{challenge.title}</h1>
            <p className="text-gray-400">{challenge.description}</p>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error loading challenge:', error);
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Error Loading Challenge</h1>
          <p className="text-gray-400">Please try again later.</p>
        </div>
      </div>
    );
  }
}
