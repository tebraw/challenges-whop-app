"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, Upload, Trophy, ArrowLeft, MessageCircle, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  imageUrl?: string;
  participants: number;
  isParticipating: boolean;
  rewards: Array<{
    rank: number;
    title: string;
    description: string;
  }>;
  stats: {
    totalDays: number;
    completed: number;
    remaining: number;
    participants: number;
  };
}

export default function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [activeProofType, setActiveProofType] = useState<"file" | "text" | "link">("file");

  useEffect(() => {
    async function loadChallenge() {
      try {
        const resolvedParams = await params;
        
        // Mock data based on screenshots
        const mockChallenge: Challenge = {
          id: resolvedParams.id,
          title: "15K Steps Challenge",
          description: "ENTER the Challenge and send daily proof to WIN a 1 on 1 coaching session",
          startAt: "2025-04-09",
          endAt: "2025-11-09",
          imageUrl: "/api/placeholder/300/200",
          participants: 1,
          isParticipating: true,
          rewards: [
            {
              rank: 1,
              title: "1 on 1 Coaching Session",
              description: "Live coaching with me"
            },
            {
              rank: 2,
              title: "1 Week Meal Plan",
              description: ""
            },
            {
              rank: 3,
              title: "Free Abs Workout PDF",
              description: ""
            }
          ],
          stats: {
            totalDays: 7,
            completed: 0,
            remaining: 7,
            participants: 1
          }
        };
        
        setChallenge(mockChallenge);
      } catch (error) {
        console.error("Error loading challenge:", error);
      } finally {
        setLoading(false);
      }
    }

    loadChallenge();
  }, [params]);

  const handleJoinChallenge = () => {
    if (challenge) {
      setChallenge({
        ...challenge,
        isParticipating: true,
        participants: challenge.participants + 1
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-20">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-800 rounded-2xl mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 bg-gray-800 rounded-xl"></div>
                <div className="h-64 bg-gray-800 rounded-xl"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-800 rounded-xl"></div>
                <div className="h-48 bg-gray-800 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Challenge not found</h1>
          <Link href="/discover" className="text-blue-400 hover:text-blue-300">
            ← Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex items-center space-x-6">
            {challenge.imageUrl && (
              <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={challenge.imageUrl}
                  alt={challenge.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              {challenge.isParticipating && (
                <div className="inline-flex items-center bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
                  ✓ You're participating!
                </div>
              )}
              <h1 className="text-4xl font-bold mb-4">{challenge.title}</h1>
              <p className="text-xl text-white/90 mb-4 flex items-center">
                🔥 {challenge.description} 🔥
              </p>
              <div className="flex items-center space-x-6 text-white/80">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {new Date(challenge.startAt).toLocaleDateString()} - {new Date(challenge.endAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Daily commitment
                </div>
              </div>
            </div>
            {!challenge.isParticipating && (
              <button
                onClick={handleJoinChallenge}
                className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center"
              >
                🚀 Join Challenge
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Rewards Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                🏆 Rewards & Prizes
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {challenge.rewards.map((reward) => (
                  <div
                    key={reward.rank}
                    className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-6 text-center"
                  >
                    <div className="text-2xl font-bold mb-2">
                      #{reward.rank}
                    </div>
                    <h3 className="font-semibold mb-2">{reward.title}</h3>
                    {reward.description && (
                      <p className="text-sm text-white/80">{reward.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Challenge Info */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  ℹ️
                </div>
                <div>
                  <h3 className="font-semibold">Challenge starts on {new Date(challenge.startAt).toLocaleDateString()}</h3>
                  <p className="text-gray-400 text-sm">{challenge.stats.totalDays} days • {challenge.participants} participants</p>
                </div>
              </div>
            </div>

            {/* Motivational Sections */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4">
                    🎯
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Challenge Yourself</h3>
                  </div>
                </div>
                <p className="text-gray-300">
                  Join a community of motivated individuals working towards their goals. Track your progress and stay accountable with daily check-ins.
                </p>
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mr-4">
                    🏆
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Earn Recognition</h3>
                  </div>
                </div>
                <p className="text-gray-300">
                  Complete the challenge to earn your spot on the leaderboard and gain recognition for your dedication and consistency.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Participation Status */}
            {challenge.isParticipating && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-green-400">
                    ✓ You're participating!
                    <br />
                    <span className="text-sm text-gray-400">Good luck with your challenge 🎯</span>
                  </div>
                  <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                    💬 Join Community Chat
                  </button>
                  <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                    📊 View My Stats
                  </button>
                </div>
              </div>
            )}

            {/* Motivation Card */}
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">💪</div>
              <h3 className="font-semibold text-lg mb-2">Stay Strong!</h3>
              <p className="text-gray-300 text-sm">
                Every day you complete brings you closer to your goal. You've got this!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
