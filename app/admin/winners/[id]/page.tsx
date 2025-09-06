"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Mail, Send } from "lucide-react";
import Link from "next/link";

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  completionRate: number;
  isEligible: boolean;
}

interface Winner {
  rank: number;
  participant: Participant | null;
  prize: string;
}

export default function SelectWinnersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [challenge, setChallenge] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([
    { rank: 1, participant: null, prize: "1st Place" },
    { rank: 2, participant: null, prize: "2nd Place" },
    { rank: 3, participant: null, prize: "3rd Place" }
  ]);
  const [selectedRank, setSelectedRank] = useState<number>(1);
  const [notification, setNotification] = useState({
    title: "Congratulations! You won 1st Place in",
    message: "*this challenge*!"
  });

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params;
      
      // Mock data
      setChallenge({
        id: resolvedParams.id,
        title: "15K Steps Challenge",
        participants: 1
      });

      setParticipants([
        {
          id: "1",
          name: "Demo User",
          email: "demo@example.com",
          completionRate: 100,
          isEligible: true
        }
      ]);

      // Set demo user as 1st place winner
      setWinners(prev => prev.map(winner => 
        winner.rank === 1 
          ? { ...winner, participant: participants[0] || null }
          : winner
      ));
    }

    loadData();
  }, [params]);

  const handleSelectWinner = (participant: Participant) => {
    setWinners(prev => prev.map(winner => 
      winner.rank === selectedRank 
        ? { ...winner, participant }
        : winner
    ));
  };

  const handleRemoveWinner = (rank: number) => {
    setWinners(prev => prev.map(winner => 
      winner.rank === rank 
        ? { ...winner, participant: null }
        : winner
    ));
  };

  const handleSendNotification = (rank: number) => {
    const winner = winners.find(w => w.rank === rank);
    if (winner?.participant) {
      console.log(`Sending notification to ${winner.participant.name}`);
      // Implementation for sending notification
    }
  };

  const handleSaveWinners = () => {
    console.log("Saving winners:", winners.filter(w => w.participant));
    // Implementation for saving winners
  };

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-20">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-gray-800 rounded-lg"></div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="h-96 bg-gray-800 rounded-xl"></div>
              <div className="h-96 bg-gray-800 rounded-xl"></div>
              <div className="h-96 bg-gray-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const eligibleParticipants = participants.filter(p => p.isEligible);

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            href="/admin"
            className="flex items-center text-gray-400 hover:text-white transition-colors mr-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Admin
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Select Challenge Winners</h1>
          <p className="text-gray-400">• {eligibleParticipants.length} eligible participants</p>
        </div>

        {/* Main Content */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Trophy className="w-6 h-6 text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold">Selected Winners</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">Select Rank:</span>
                <select
                  value={selectedRank}
                  onChange={(e) => setSelectedRank(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1st Place</option>
                  <option value={2}>2nd Place</option>
                  <option value={3}>3rd Place</option>
                </select>
              </div>
              <button
                onClick={handleSaveWinners}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Save Winners
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {winners.map((winner) => (
              <div
                key={winner.rank}
                className={`rounded-xl p-6 border-2 transition-all ${
                  winner.rank === 1
                    ? "bg-gradient-to-br from-yellow-600/20 to-yellow-500/20 border-yellow-500"
                    : winner.rank === 2
                    ? "bg-gradient-to-br from-gray-600/20 to-gray-500/20 border-gray-400"
                    : "bg-gradient-to-br from-orange-600/20 to-orange-500/20 border-orange-500"
                }`}
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">
                    {winner.rank === 1 ? "🥇" : winner.rank === 2 ? "🥈" : "🥉"}
                  </div>
                  <h3 className="text-xl font-bold">{winner.prize}</h3>
                </div>

                {winner.participant ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                      {winner.participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-center text-green-400 mb-1">
                        ✓ {winner.participant.name}
                      </div>
                      <div className="text-sm text-gray-400">{winner.participant.email}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleRemoveWinner(winner.rank)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove Winner
                      </button>
                      
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <Mail className="w-4 h-4 mr-2 text-blue-400" />
                          <span className="text-sm font-medium">Send Notification</span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-3">
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 bg-orange-500 rounded text-xs flex items-center justify-center mr-2">
                                🎉
                              </div>
                              <span className="text-sm font-medium">{notification.title}</span>
                            </div>
                            <div className="text-sm text-gray-300">{notification.message}</div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSendNotification(winner.rank)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Send Notification
                            </button>
                            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-xs font-medium transition-colors">
                              Send via Whop
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-500 text-sm">Empty</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">Click on a participant below to select</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center text-gray-400 text-sm">
            Save winners first, then send individual notifications above
          </div>
        </div>

        {/* Eligible Participants */}
        {eligibleParticipants.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Eligible Participants</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eligibleParticipants.map((participant) => (
                <button
                  key={participant.id}
                  onClick={() => handleSelectWinner(participant)}
                  className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-left transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-sm text-gray-400">{participant.email}</div>
                      <div className="text-xs text-green-400">
                        {participant.completionRate}% completion
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
