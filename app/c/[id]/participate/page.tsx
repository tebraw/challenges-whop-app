"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Upload, Trophy, BarChart3, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function ChallengeParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [challenge, setChallenge] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeProofType, setActiveProofType] = useState<"file" | "text" | "link">("file");
  const [proofText, setProofText] = useState("");
  const [proofLink, setProofLink] = useState("");

  useEffect(() => {
    async function loadChallenge() {
      const resolvedParams = await params;
      
      // Mock data - using new check-in system
      setChallenge({
        id: resolvedParams.id,
        title: "10K Steps Challenge", // ← Fixed to match real challenge
        description: "ENTER the Challenge and send daily proof to WIN a 1 on 1 coaching session",
        startAt: "2025-04-09",
        endAt: "2025-11-09",
        participants: 1,
        isParticipating: true,
        checkins: { completed: 3, total: 18 }, // Changed from streak to checkins
        stats: {
          totalDays: 18,
          completed: 3,
          remaining: 15,
          participants: 1
        }
      });
    }

    loadChallenge();
  }, [params]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleSubmitProof = () => {
    console.log("Submitting proof...");
    // Implementation for proof submission
  };

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-20">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-800 rounded-2xl"></div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-800 rounded-xl"></div>
              <div className="h-96 bg-gray-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">💪</span>
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
                ✓ You're participating!
              </div>
              <h1 className="text-3xl font-bold mb-2">{challenge.title}</h1>
              <p className="text-lg text-white/90 mb-3">
                🔥 {challenge.description} 🔥
              </p>
              <div className="flex items-center space-x-6 text-white/80">
                <span>📅 {new Date(challenge.startAt).toLocaleDateString()} - {new Date(challenge.endAt).toLocaleDateString()}</span>
                <span>👥 {challenge.participants} participants</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Challenge Status */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                  🚀
                </div>
                <div>
                  <h3 className="font-semibold">Challenge Status</h3>
                  <p className="text-gray-400 text-sm">Challenge starts on {new Date(challenge.startAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                  🔥
                </div>
                <div>
                  <h3 className="font-semibold">Your Progress</h3>
                  <p className="text-gray-400 text-sm">Keep checking in every day!</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Check-ins: {challenge.checkins.completed} / {challenge.checkins.total}</span>
                  <span className="text-sm text-green-400">{Math.round((challenge.checkins.completed / challenge.checkins.total) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(challenge.checkins.completed / challenge.checkins.total) * 100}%` }}
                  ></div>
                </div>
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(challenge.checkins.total, 14) }, (_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        i < challenge.checkins.completed 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-500'
                      }`}
                    >
                      {i < challenge.checkins.completed ? '✓' : '•'}
                    </div>
                  ))}
                  {challenge.checkins.total > 14 && (
                    <div className="flex items-center text-gray-400 text-xs ml-2">
                      +{challenge.checkins.total - 14} more days
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Proof Section */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  📤
                </div>
                <div>
                  <h3 className="font-semibold">Submit Your Proof</h3>
                  <p className="text-gray-400 text-sm">Upload your daily progress</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center text-blue-400 mb-4">
                  📷 Required proof type: Upload a file (photo,img-file)
                </div>

                {/* Proof Type Tabs */}
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => setActiveProofType("file")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeProofType === "file"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    File
                  </button>
                  <button
                    onClick={() => setActiveProofType("text")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeProofType === "text"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setActiveProofType("link")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeProofType === "link"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    Link
                  </button>
                </div>

                {/* File Upload */}
                {activeProofType === "file" && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Select file to upload</div>
                    <div className="flex space-x-2">
                      <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg cursor-pointer text-center transition-colors">
                        {selectedFile ? selectedFile.name : "Datei auswählen"}
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="image/*"
                        />
                      </label>
                      <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                        Keine Datei ausgewählt
                      </button>
                    </div>
                  </div>
                )}

                {/* Text Input */}
                {activeProofType === "text" && (
                  <textarea
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    placeholder="Enter your proof text..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                )}

                {/* Link Input */}
                {activeProofType === "link" && (
                  <input
                    type="url"
                    value={proofLink}
                    onChange={(e) => setProofLink(e.target.value)}
                    placeholder="Enter proof link..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}

                <button
                  onClick={handleSubmitProof}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg font-medium transition-colors mt-4"
                >
                  Submit Proof
                </button>
              </div>
            </div>

            {/* Challenge Details */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  📋
                </div>
                <div>
                  <h3 className="font-semibold">Challenge Details</h3>
                  <p className="text-gray-400 text-sm">Important information for participants</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{challenge.stats.totalDays}</div>
                  <div className="text-sm text-gray-400">Total Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{challenge.stats.completed}</div>
                  <div className="text-sm text-gray-400">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{challenge.stats.remaining}</div>
                  <div className="text-sm text-gray-400">Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{challenge.stats.participants}</div>
                  <div className="text-sm text-gray-400">Participants</div>
                </div>
              </div>
            </div>

            {/* Terms & Rules */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center mr-3">
                  📜
                </div>
                <div>
                  <h3 className="font-semibold">Challenge Terms & Rules</h3>
                  <p className="text-gray-400 text-sm">Important information for participants</p>
                </div>
              </div>

              <div className="text-gray-300 text-sm space-y-2">
                <p>This is an engagement challenge. Winners will be selected randomly from participants who successfully complete all challenge criteria. By participating, you agree that:</p>
                <p>1. You will complete all required activities according to the challenge rules</p>
                <p>2. You will submit daily proof of completion</p>
                <p>3. You understand this is a skill-building exercise</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <div className="flex items-center text-green-400 mb-4">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3 text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="font-medium">You're participating!</div>
                    <div className="text-sm text-gray-400">Good luck with your challenge 🎯</div>
                  </div>
                </div>
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Join Community Chat
                </button>
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View My Stats
                </button>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center mr-3">
                  🏆
                </div>
                <h3 className="font-semibold">Leaderboard</h3>
              </div>
              
              <div className="text-center text-gray-400 py-8">
                <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                <p>Leaderboard</p>
                <p className="text-sm">No entries yet.</p>
              </div>
            </div>

            {/* Motivation */}
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
