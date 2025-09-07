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
      // Load real challenge data from API
      const response = await fetch(`/api/admin/challenges/${id}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load challenge data');
      }
      
      const data = await response.json();
      setChallenge(data);
      
      // Process participants from leaderboard data
      if (data.leaderboard && data.leaderboard.length > 0) {
        const processedParticipants: Participant[] = data.leaderboard.map((participant: any) => ({
          id: participant.id,
          name: participant.username || participant.email.split('@')[0],
          email: participant.email,
          avatar: '�',
          completionRate: Math.round(participant.completionRate || 0),
          isEligible: (participant.checkIns || 0) > 0 // Only eligible if has check-ins
        }));
        
        // Sort by completion rate (highest first), then by join date (earliest first)
        processedParticipants.sort((a, b) => {
          if (b.completionRate !== a.completionRate) {
            return b.completionRate - a.completionRate;
          }
          // If completion rates are equal, maintain original order (join date)
          return 0;
        });
        
        setParticipants(processedParticipants);
      } else {
        setParticipants([]);
      }
      
    } catch (error) {
      console.error('Error loading challenge data:', error);
      setChallenge(null);
      setParticipants([]);
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

  const autoSelectTop3 = () => {
    const eligibleParticipants = participants.filter(p => p.isEligible);
    const top3 = eligibleParticipants.slice(0, 3);
    
    setWinners(prev => prev.map((winner, index) => ({
      ...winner,
      participant: top3[index] || null
    })));
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
                      onClick={() => {
                        if (!participant.isEligible) return;
                        
                        if (isSelected) {
                          // Remove from winners if already selected
                          selectWinner(selectedRank!, participant);
                        } else {
                          // Find next available winner slot
                          const availableSlot = winners.find(w => !w.participant);
                          if (availableSlot) {
                            selectWinner(availableSlot.rank, participant);
                          }
                        }
                      }}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        !participant.isEligible 
                          ? 'border-gray-700 bg-gray-800 opacity-50 cursor-not-allowed'
                          : isSelected 
                            ? 'border-yellow-500 bg-yellow-900/20' 
                            : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{participant.avatar}</div>
                          <div>
                            <h3 className="font-semibold">{participant.name}</h3>
                            <p className="text-sm text-gray-400">{participant.email}</p>
                            {!participant.isEligible && (
                              <p className="text-xs text-red-400">Not eligible (no check-ins)</p>
                            )}
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
                          {!isSelected && participant.isEligible && (
                            <div className="text-blue-400 text-sm">
                              Click to select
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
                  onClick={autoSelectTop3}
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
