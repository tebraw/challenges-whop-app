"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Save, Eye, X, Mail, Send, Crown, Medal, Award } from "lucide-react";
import Link from "next/link";

interface Participant {
  id: string;
  name: string;
  email: string;
  completionRate: number;
  checkIns: number;
  isEligible: boolean;
}

interface Winner {
  rank: number;
  participant: Participant | null;
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
  const [selectedRank, setSelectedRank] = useState<number>(1);
  const [winners, setWinners] = useState<Winner[]>([
    { rank: 1, participant: null, customMessage: "🎉 Congratulations! You won 1st Place in this challenge!" },
    { rank: 2, participant: null, customMessage: "🎉 Congratulations! You won 2nd Place in this challenge!" },
    { rank: 3, participant: null, customMessage: "🎉 Congratulations! You won 3rd Place in this challenge!" }
  ]);
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

  const saveWinners = async () => {
    try {
      const winnersData = winners
        .filter(w => w.participant)
        .map(w => ({
          challengeId,
          participantId: w.participant!.id,
          rank: w.rank
        }));

      const response = await fetch(`/api/admin/challenges/${challengeId}/winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winners: winnersData }),
      });

      if (response.ok) {
        alert('Winners saved successfully!');
      } else {
        throw new Error('Failed to save winners');
      }
    } catch (error) {
      console.error('Error saving winners:', error);
      alert('Error saving winners');
    }
  };

  const sendIndividualNotification = async (winner: Winner) => {
    if (!winner.participant) return;

    try {
      const response = await fetch('/api/whop/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: winner.participant.email,
          message: winner.customMessage,
          type: 'winner_announcement'
        }),
      });

      if (response.ok) {
        alert(`Notification sent to ${winner.participant.name} via Whop!`);
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification');
    }
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

          {/* Selected Winners */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Selected Winners
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Select Rank:</label>
                    <select
                      value={selectedRank}
                      onChange={(e) => setSelectedRank(Number(e.target.value))}
                      className="bg-gray-700 border border-gray-600 text-white px-3 py-1 rounded"
                    >
                      <option value={1}>1st Place</option>
                      <option value={2}>2nd Place</option>
                      <option value={3}>3rd Place</option>
                    </select>
                  </div>
                  <button
                    onClick={saveWinners}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Winners
                  </button>
                </div>
              </div>

              {/* Winner Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {winners.map((winner) => {
                  const getPlaceIcon = (rank: number) => {
                    switch(rank) {
                      case 1: return <Crown className="h-8 w-8 text-yellow-400" />;
                      case 2: return <Medal className="h-8 w-8 text-gray-300" />;
                      case 3: return <Award className="h-8 w-8 text-orange-400" />;
                      default: return <Trophy className="h-8 w-8 text-gray-400" />;
                    }
                  };

                  const getPlaceColor = (rank: number) => {
                    switch(rank) {
                      case 1: return 'border-yellow-500 bg-yellow-900/10';
                      case 2: return 'border-gray-400 bg-gray-900/10';
                      case 3: return 'border-orange-500 bg-orange-900/10';
                      default: return 'border-gray-600 bg-gray-800';
                    }
                  };

                  const getPlaceText = (rank: number) => {
                    switch(rank) {
                      case 1: return { text: '1st Place', color: 'text-yellow-400' };
                      case 2: return { text: '2nd Place', color: 'text-gray-300' };
                      case 3: return { text: '3rd Place', color: 'text-orange-400' };
                      default: return { text: `${rank}th Place`, color: 'text-gray-400' };
                    }
                  };

                  const placeInfo = getPlaceText(winner.rank);

                  return (
                    <div key={winner.rank} className={`border-2 rounded-lg p-6 ${getPlaceColor(winner.rank)}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getPlaceIcon(winner.rank)}
                          <h3 className={`font-semibold text-lg ${placeInfo.color}`}>
                            {placeInfo.text}
                          </h3>
                        </div>
                      </div>
                      
                      {winner.participant ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-white">{winner.participant.name}</div>
                              <div className="text-sm text-gray-400">
                                {winner.participant.completionRate}% completion
                              </div>
                            </div>
                            <button
                              onClick={() => removeWinner(winner.rank)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove Winner
                            </button>
                          </div>

                          {/* Custom Message Input */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-blue-400" />
                              <label className="text-sm font-medium text-gray-300">Send Notification</label>
                            </div>
                            <textarea
                              value={winner.customMessage}
                              onChange={(e) => updateWinnerMessage(winner.rank, e.target.value)}
                              placeholder={`Congratulations! You won ${placeInfo.text} in "this challenge"!`}
                              className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm resize-none focus:border-blue-500 focus:outline-none"
                              rows={3}
                            />
                            <button
                              onClick={() => sendIndividualNotification(winner)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Send className="h-4 w-4" />
                              Send via Whop
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                          <p className="text-gray-400 text-sm">Click on a participant below to select</p>
                          <p className="text-gray-500 text-xs mt-1">Empty</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-600 text-center">
                <p className="text-gray-400 text-sm mb-4">Save winners first, then send individual notifications above.</p>
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
