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
  params: Promise<{ challengeId: string }>;
}) {
  const [challengeId, setChallengeId] = useState<string>("");
  const [challenge, setChallenge] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([
    { rank: 1, participant: null, prize: "1st Place" },
    { rank: 2, participant: null, prize: "2nd Place" },
    { rank: 3, participant: null, prize: "3rd Place" },
  ]);
  const [notifications, setNotifications] = useState({
    winners: false,
    allParticipants: false,
    customMessage: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const resolvedParams = await params;
      setChallengeId(resolvedParams.challengeId);
      loadChallengeData(resolvedParams.challengeId);
    }
    init();
  }, [params]);

  const loadChallengeData = async (id: string) => {
    setLoading(true);
    try {
      // Development mode - use mock data
      if (process.env.NODE_ENV === 'development') {
        const mockChallenge = {
          id,
          title: "30-Day Fitness Challenge",
          description: "Transform your fitness in 30 days",
          startAt: new Date('2025-09-01'),
          endAt: new Date('2025-09-30'),
          status: "completed"
        };

        const mockParticipants: Participant[] = [
          {
            id: '1',
            name: 'Alex Johnson',
            email: 'alex@example.com',
            avatar: '💪',
            completionRate: 95,
            isEligible: true
          },
          {
            id: '2',
            name: 'Sarah Wilson',
            email: 'sarah@example.com',
            avatar: '🏃‍♀️',
            completionRate: 89,
            isEligible: true
          },
          {
            id: '3',
            name: 'Mike Chen',
            email: 'mike@example.com',
            avatar: '🧘‍♂️',
            completionRate: 87,
            isEligible: true
          },
          {
            id: '4',
            name: 'Emma Davis',
            email: 'emma@example.com',
            avatar: '⭐',
            completionRate: 83,
            isEligible: true
          },
          {
            id: '5',
            name: 'David Brown',
            email: 'david@example.com',
            avatar: '🎯',
            completionRate: 78,
            isEligible: true
          }
        ];

        setChallenge(mockChallenge);
        setParticipants(mockParticipants);
      } else {
        // Production mode would fetch real data here
        console.log('Loading challenge data for:', id);
      }
    } catch (error) {
      console.error('Error loading challenge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectWinner = (rank: number, participant: Participant) => {
    setWinners(prev => prev.map(winner => 
      winner.rank === rank 
        ? { ...winner, participant }
        : winner.participant?.id === participant.id 
          ? { ...winner, participant: null }
          : winner
    ));
  };

  const sendNotifications = async () => {
    try {
      console.log('Sending notifications...', notifications);
      // Implementation would go here
      alert('Notifications sent successfully!');
    } catch (error) {
      console.error('Error sending notifications:', error);
      alert('Error sending notifications');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading challenge data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Select Winners</h1>
            <p className="text-gray-400">{challenge?.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Participants List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Eligible Participants</h2>
              <div className="space-y-3">
                {participants.map((participant) => {
                  const isSelected = winners.some(w => w.participant?.id === participant.id);
                  const selectedRank = winners.find(w => w.participant?.id === participant.id)?.rank;
                  
                  return (
                    <div 
                      key={participant.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-yellow-500 bg-yellow-900/20' 
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{participant.avatar}</div>
                          <div>
                            <h3 className="font-semibold">{participant.name}</h3>
                            <p className="text-sm text-gray-400">{participant.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold text-green-400">
                              {participant.completionRate}%
                            </div>
                            <div className="text-xs text-gray-400">Completion</div>
                          </div>
                          {isSelected && (
                            <div className="bg-yellow-600 text-black px-3 py-1 rounded-full text-sm font-bold">
                              #{selectedRank} Winner
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Winners Selection */}
          <div className="space-y-6">
            {/* Winner Slots */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Winners
              </h2>
              <div className="space-y-4">
                {winners.map((winner) => (
                  <div key={winner.rank} className="border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-yellow-400">#{winner.rank} Place</h3>
                      <span className="text-sm text-gray-400">{winner.prize}</span>
                    </div>
                    
                    {winner.participant ? (
                      <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                        <div className="text-xl">{winner.participant.avatar}</div>
                        <div className="flex-1">
                          <div className="font-medium">{winner.participant.name}</div>
                          <div className="text-sm text-gray-400">
                            {winner.participant.completionRate}% completion
                          </div>
                        </div>
                        <button
                          onClick={() => selectWinner(winner.rank, winner.participant!)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-gray-600 rounded-lg">
                        <p className="text-gray-400 text-sm">Click a participant to assign</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Assign */}
              <div className="mt-6 pt-6 border-t border-gray-600">
                <button
                  onClick={() => {
                    const topParticipants = participants
                      .filter(p => p.isEligible)
                      .sort((a, b) => b.completionRate - a.completionRate)
                      .slice(0, 3);
                    
                    setWinners(prev => prev.map((winner, index) => ({
                      ...winner,
                      participant: topParticipants[index] || null
                    })));
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Auto-Select Top 3
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-500" />
                Notifications
              </h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notifications.winners}
                    onChange={(e) => setNotifications(prev => ({
                      ...prev,
                      winners: e.target.checked
                    }))}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  <span>Notify winners</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notifications.allParticipants}
                    onChange={(e) => setNotifications(prev => ({
                      ...prev,
                      allParticipants: e.target.checked
                    }))}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  <span>Notify all participants</span>
                </label>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Custom message</label>
                  <textarea
                    value={notifications.customMessage}
                    onChange={(e) => setNotifications(prev => ({
                      ...prev,
                      customMessage: e.target.value
                    }))}
                    placeholder="Optional message for participants..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                    rows={3}
                  />
                </div>
                
                <button
                  onClick={sendNotifications}
                  disabled={!notifications.winners && !notifications.allParticipants}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add click handler for participant selection
declare global {
  interface Window {
    selectParticipantAsWinner: (participantId: string, rank: number) => void;
  }
}
