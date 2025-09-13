"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Mail, Send, Eye, X } from "lucide-react";
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
  customMessage: string;
}

interface Checkin {
  id: string;
  submittedAt: string;
  proofText?: string;
  proofImage?: string;
  status: string;
}

export default function SelectWinnersPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const [challengeId, setChallengeId] = useState<string>("");
  const [challenge, setChallenge] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showCheckinsModal, setShowCheckinsModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [participantCheckins, setParticipantCheckins] = useState<Checkin[]>([]);
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
      
      // Initialize winners based on number of rewards in challenge
      const numRewards = data.rewards?.length || 1;
      const initialWinners: Winner[] = [];
      
      for (let i = 1; i <= Math.min(numRewards, 3); i++) {
        const rewardTitle = data.rewards?.[i-1]?.title || `${i === 1 ? '1st' : i === 2 ? '2nd' : '3rd'} Place`;
        initialWinners.push({
          rank: i,
          participant: null,
          prize: rewardTitle,
          customMessage: `🎉 Congratulations! You won ${i === 1 ? '1st' : i === 2 ? '2nd' : '3rd'} place in "${data.title}"!`
        });
      }
      
      setWinners(initialWinners);
      
      // Process participants from leaderboard data
      if (data.leaderboard && data.leaderboard.length > 0) {
        const processedParticipants: Participant[] = data.leaderboard.map((participant: any) => ({
          id: participant.id,
          name: participant.username || participant.email.split('@')[0],
          email: participant.email,
          avatar: '👤',
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

  const removeWinner = (rank: number) => {
    setWinners(prev => prev.map(winner => 
      winner.rank === rank 
        ? { ...winner, participant: null }
        : winner
    ));
  };

  const updateWinnerMessage = (rank: number, message: string) => {
    setWinners(prev => prev.map(winner => 
      winner.rank === rank 
        ? { ...winner, customMessage: message }
        : winner
    ));
  };

  const autoSelectTop = () => {
    const eligibleParticipants = participants.filter(p => p.isEligible);
    
    setWinners(prev => prev.map((winner, index) => ({
      ...winner,
      participant: eligibleParticipants[index] || null
    })));
  };

  const loadParticipantCheckins = async (participant: Participant) => {
    try {
      setSelectedParticipant(participant);
      setShowCheckinsModal(true);
      
      // Fetch participant's check-ins/proofs
      const response = await fetch(`/api/admin/users/${participant.id}/challenges/${challengeId}`, {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setParticipantCheckins(data.checkins || []);
      } else {
        setParticipantCheckins([]);
      }
    } catch (error) {
      console.error('Error loading participant check-ins:', error);
      setParticipantCheckins([]);
    }
  };

  const sendNotificationsViaWhop = async () => {
    try {
      const winnersWithMessages = winners
        .filter(w => w.participant)
        .map(w => ({
          participantId: w.participant!.id,
          email: w.participant!.email,
          rank: w.rank,
          message: w.customMessage
        }));

      // Send notifications via Whop API
      for (const winner of winnersWithMessages) {
        await fetch('/api/whop/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: winner.email,
            message: winner.message,
            type: 'winner_announcement'
          }),
        });
      }
      
      alert('Notifications sent successfully via Whop!');
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
                        !participant.isEligible 
                          ? 'border-gray-700 bg-gray-800 opacity-50'
                          : isSelected 
                            ? 'border-yellow-500 bg-yellow-900/20' 
                            : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => {
                            if (!participant.isEligible) return;
                            
                            if (isSelected) {
                              removeWinner(selectedRank!);
                            } else {
                              // Find next available winner slot
                              const availableSlot = winners.find(w => !w.participant);
                              if (availableSlot) {
                                selectWinner(availableSlot.rank, participant);
                              }
                            }
                          }}
                        >
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
                          {participant.isEligible && (
                            <button
                              onClick={() => loadParticipantCheckins(participant)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              See Check-ins
                            </button>
                          )}
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
                Selected Winners
              </h2>
              <div className="space-y-4">
                {winners.map((winner) => (
                  <div key={winner.rank} className="border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-yellow-400">#{winner.rank} Place</h3>
                      <span className="text-sm text-gray-400">{winner.prize}</span>
                    </div>
                    
                    {winner.participant ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{winner.participant.name}</div>
                            <div className="text-sm text-gray-400">
                              {winner.participant.completionRate}% completion
                            </div>
                          </div>
                          <button
                            onClick={() => removeWinner(winner.rank)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        
                        {/* Custom Message */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Notification Message:</label>
                          <textarea
                            value={winner.customMessage}
                            onChange={(e) => updateWinnerMessage(winner.rank, e.target.value)}
                            placeholder="Customize the winner notification..."
                            className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm"
                            rows={3}
                          />
                        </div>
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
                  onClick={autoSelectTop}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Auto-Select Top {winners.length}
                </button>
              </div>
            </div>

            {/* Send Notifications */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-500" />
                Send Notifications
              </h2>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Notifications will be sent via Whop to all selected winners with their custom messages.
                </p>
                
                <button
                  onClick={sendNotificationsViaWhop}
                  disabled={!winners.some(w => w.participant)}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send via Whop ({winners.filter(w => w.participant).length} recipients)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Check-ins Modal */}
        {showCheckinsModal && selectedParticipant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold">
                  Check-ins for {selectedParticipant.name}
                </h2>
                <button
                  onClick={() => setShowCheckinsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {participantCheckins.length > 0 ? (
                  <div className="space-y-4">
                    {participantCheckins.map((checkin) => (
                      <div key={checkin.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">
                            {new Date(checkin.submittedAt).toLocaleDateString()} {new Date(checkin.submittedAt).toLocaleTimeString()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            checkin.status === 'APPROVED' ? 'bg-green-600' :
                            checkin.status === 'REJECTED' ? 'bg-red-600' : 'bg-yellow-600'
                          }`}>
                            {checkin.status}
                          </span>
                        </div>
                        
                        {checkin.proofText && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-300">Text Proof:</p>
                            <p className="text-white">{checkin.proofText}</p>
                          </div>
                        )}
                        
                        {checkin.proofImage && (
                          <div>
                            <p className="text-sm font-medium text-gray-300 mb-2">Image Proof:</p>
                            <img 
                              src={checkin.proofImage} 
                              alt="Proof" 
                              className="max-w-full h-auto rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No check-ins found for this participant.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
