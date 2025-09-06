import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// Mock challenge data for development
const mockChallenge = {
  id: 'cmf7lrtlq000314ehs17u67jy',
  title: '30-Day Fitness Challenge',
  description: 'Transform your fitness in 30 days',
  imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
  category: 'Fitness',
  startAt: new Date('2025-09-01'),
  endAt: new Date('2025-09-30'),
  isActive: true,
  proofType: 'PHOTO',
  rules: {
    dailyCheckIn: true,
    requirements: [
      'Complete daily 30-minute workout',
      'Upload photo proof of exercise',
      'Maintain minimum 80% check-in rate'
    ]
  },
  enrollment: {
    id: 'enrollment-1',
    joinedAt: new Date('2025-09-01'),
    status: 'ACTIVE',
    currentStreak: 5,
    totalCheckIns: 5,
    lastCheckIn: new Date()
  },
  _count: { 
    enrollments: 42 
  }
};

const mockLeaderboard = [
  { rank: 1, username: 'FitnessGuru', totalCheckIns: 28, currentStreak: 15, avatar: '💪' },
  { rank: 2, username: 'HealthyLife', totalCheckIns: 26, currentStreak: 12, avatar: '🏃‍♀️' },
  { rank: 3, username: 'WellnessWarrior', totalCheckIns: 25, currentStreak: 10, avatar: '🧘‍♂️' },
  { rank: 4, username: 'You', totalCheckIns: 5, currentStreak: 5, avatar: '⭐', isCurrentUser: true },
];

export default async function ParticipantePage({
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
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/challenges/${challengeId}`} className="text-gray-400 hover:text-white">
              ← Back to Challenge
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Challenge Header */}
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={challenge.imageUrl}
                    alt={challenge.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h1 className="text-2xl font-bold">{challenge.title}</h1>
                    <p className="text-gray-400">{challenge.category}</p>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">{challenge.enrollment.currentStreak}</div>
                    <div className="text-sm text-gray-400">Current Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">{challenge.enrollment.totalCheckIns}</div>
                    <div className="text-sm text-gray-400">Total Check-ins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">#{mockLeaderboard.find(u => u.isCurrentUser)?.rank}</div>
                    <div className="text-sm text-gray-400">Your Rank</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{Math.round((challenge.enrollment.totalCheckIns / 30) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                      style={{ width: `${(challenge.enrollment.totalCheckIns / 30) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Proof Upload */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">📸 Today's Check-in</h2>
                <p className="text-gray-400 mb-6">Upload your workout photo to maintain your streak!</p>
                
                <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <div className="text-6xl mb-4">📷</div>
                  <h3 className="text-lg font-semibold mb-2">Upload Proof Photo</h3>
                  <p className="text-gray-400 mb-4">Drag & drop your workout photo here, or click to browse</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    Choose File
                  </button>
                </div>

                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold text-blue-400 mb-2">💡 Pro Tips:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Show yourself actively exercising</li>
                    <li>• Include the gym/location in the background</li>
                    <li>• Make sure the image is clear and well-lit</li>
                  </ul>
                </div>
              </div>

              {/* Recent Check-ins */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">📅 Your Recent Check-ins</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-gray-700 rounded-lg p-4">
                      <div className="aspect-square bg-gray-600 rounded-lg mb-3 flex items-center justify-center">
                        <span className="text-2xl">💪</span>
                      </div>
                      <div className="text-sm text-gray-400">Day {30 - i}</div>
                      <div className="text-xs text-green-400">✓ Completed</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Challenge Stats */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">📊 Challenge Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Participants</span>
                    <span className="font-semibold">{challenge._count.enrollments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Days Left</span>
                    <span className="font-semibold text-orange-400">25</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Streak</span>
                    <span className="font-semibold text-blue-400">{challenge.enrollment.currentStreak} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Completion Rate</span>
                    <span className="font-semibold text-green-400">
                      {Math.round((challenge.enrollment.totalCheckIns / 5) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">🏆 Leaderboard</h3>
                <div className="space-y-3">
                  {mockLeaderboard.map((user) => (
                    <div 
                      key={user.rank} 
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        user.isCurrentUser ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-gray-700'
                      }`}
                    >
                      <div className="text-2xl">{user.avatar}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">
                          {user.username}
                          {user.isCurrentUser && (
                            <span className="text-blue-400 ml-2">👈</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.totalCheckIns} check-ins • {user.currentStreak} streak
                        </div>
                      </div>
                      <div className="text-lg font-bold">#{user.rank}</div>
                    </div>
                  ))}
                </div>
                <Link 
                  href={`/challenges/${challengeId}/leaderboard`}
                  className="block text-center text-blue-400 hover:text-blue-300 text-sm mt-4"
                >
                  View Full Leaderboard →
                </Link>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">⚡ Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors">
                    🔥 Daily Check-in
                  </button>
                  <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors">
                    👥 View Community
                  </button>
                  <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors">
                    💬 Get Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Production mode would fetch real data here
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Participant View</h1>
          <p className="text-gray-400">Production implementation coming soon...</p>
        </div>
      </div>
    </div>
  );
}
