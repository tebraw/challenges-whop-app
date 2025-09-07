"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Save, Crown, Medal, Award, Mail, Send, Eye, X, Calendar, CheckCircle, Users } from "lucide-react";
import Link from "next/link";

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar: string;
  completionRate: number;
  checkIns: number;
  completedCheckIns: number;
  requiredCheckIns: number;
  isEligible: boolean;
  points: number;
  totalScore?: number;
  rank?: number;
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
  day: number;
}

export default function SelectWinnersPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const [challengeId, setChallengeId] = useState<string>("");
  const [challenge, setChallenge] = useState<any>(null);
  const [topParticipants, setTopParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([
    { rank: 1, participant: null, customMessage: "🎉 Congratulations! You won 1st Place in this challenge!" },
    { rank: 2, participant: null, customMessage: "🥈 Amazing job! You secured 2nd Place in this challenge!" },
    { rank: 3, participant: null, customMessage: "🥉 Well done! You earned 3rd Place in this challenge!" }
  ]);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [participantProofs, setParticipantProofs] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const resolvedParams = await params;
      setChallengeId(resolvedParams.challengeId);
      await loadChallengeData(resolvedParams.challengeId);
    }
    init();
  }, [params]);

  const loadChallengeData = async (id: string) => {
    try {
      setLoading(true);
      
      // Load eligible participants specifically for winners selection
      const response = await fetch(`/api/admin/challenges/${id}/eligible-participants`, {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setChallenge(data.challenge);
        
        // Set top participants from eligible participants
        if (data.eligibleParticipants && data.eligibleParticipants.length > 0) {
          setTopParticipants(data.eligibleParticipants);
          
          // Auto-assign top 3 to winner slots
          const autoWinners = winners.map((winner, index) => ({
            ...winner,
            participant: data.eligibleParticipants[index] || null
          }));
          setWinners(autoWinners);
        }
      } else {
        console.error('Failed to load eligible participants:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading challenge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectWinner = (rank: number, participant: Participant | null) => {
    setWinners(prev => prev.map(winner => {
      if (winner.rank === rank) {
        return { ...winner, participant };
      }
      // Remove participant from other positions if reassigning
      if (participant && winner.participant?.id === participant.id) {
        return { ...winner, participant: null };
      }
      return winner;
    }));
  };

  const loadParticipantProofs = async (participant: Participant) => {
    try {
      setSelectedParticipant(participant);
      setShowProofModal(true);
      
      const response = await fetch(`/api/admin/users/${participant.id}/challenges/${challengeId}`, {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setParticipantProofs(data.checkIns || []);
      } else {
        setParticipantProofs([]);
      }
    } catch (error) {
      console.error('Error loading participant proofs:', error);
      setParticipantProofs([]);
    }
  };

  const updateWinnerMessage = (rank: number, message: string) => {
    setWinners(prev => prev.map(winner => 
      winner.rank === rank 
        ? { ...winner, customMessage: message }
        : winner
    ));
  };

  const saveWinners = async () => {
    try {
      setSaving(true);
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
        alert('✅ Winners saved successfully!');
      } else {
        throw new Error('Failed to save winners');
      }
    } catch (error) {
      console.error('Error saving winners:', error);
      alert('❌ Error saving winners');
    } finally {
      setSaving(false);
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
          title: `🏆 You won ${getPlaceText(winner.rank).text}!`,
          type: 'winner_announcement'
        }),
      });

      if (response.ok) {
        alert(`✅ Notification sent to ${winner.participant.name} via Whop!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(`❌ Error sending notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading challenge winners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Select Challenge Winners</h1>
            <p className="text-gray-400">{challenge?.title}</p>
            <p className="text-sm text-gray-500">
              {topParticipants.length} eligible participants • Auto-selected top 3
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Winner Cards */}
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Selected Winners
              </h2>
              <button
                onClick={saveWinners}
                disabled={saving || !winners.some(w => w.participant)}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-black px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Winners'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {winners.map((winner) => {
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
                        {/* Participant Info */}
                        <div className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-white">{winner.participant.name}</div>
                              <div className="text-sm text-gray-400">{winner.participant.email}</div>
                            </div>
                            <button
                              onClick={() => loadParticipantProofs(winner.participant!)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="View Proofs"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Completion:</span>
                            <span className="text-green-400 font-semibold">
                              {winner.participant.completionRate}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Check-ins:</span>
                            <span className="text-blue-400 font-semibold">
                              {winner.participant.checkIns}
                            </span>
                          </div>
                        </div>

                        {/* Custom Message */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-400" />
                            <label className="text-sm font-medium text-gray-300">Personal Message</label>
                          </div>
                          <textarea
                            value={winner.customMessage}
                            onChange={(e) => updateWinnerMessage(winner.rank, e.target.value)}
                            placeholder={`Congratulations ${winner.participant.name}! You won ${placeInfo.text}!`}
                            className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm resize-none focus:border-blue-500 focus:outline-none transition-colors"
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

                        {/* Remove Winner */}
                        <button
                          onClick={() => selectWinner(winner.rank, null)}
                          className="w-full text-red-400 hover:text-red-300 text-sm py-2 transition-colors"
                        >
                          Remove Winner
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
                        <Trophy className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm mb-2">No winner selected</p>
                        <p className="text-gray-500 text-xs">Click a participant below to assign</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Participants */}
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Top Participants</h2>
              <p className="text-sm text-gray-400">Click to assign to winner positions</p>
            </div>
            
            <div className="space-y-3">
              {topParticipants.map((participant) => {
                const isAssigned = winners.some(w => w.participant?.id === participant.id);
                const assignedRank = winners.find(w => w.participant?.id === participant.id)?.rank;
                
                return (
                  <div 
                    key={participant.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isAssigned 
                        ? 'border-yellow-500 bg-yellow-900/20' 
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-sm font-bold">
                          #{participant.rank}
                        </div>
                        <div>
                          <h3 className="font-semibold">{participant.name}</h3>
                          <p className="text-sm text-gray-400">{participant.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-green-400 font-semibold">{participant.completionRate}%</div>
                          <div className="text-xs text-gray-400">Completion</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-400 font-semibold">{participant.checkIns}</div>
                          <div className="text-xs text-gray-400">Check-ins</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadParticipantProofs(participant)}
                            className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                            title="View Proofs"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          
                          {isAssigned ? (
                            <div className="bg-yellow-600 text-black px-3 py-1 rounded-full text-sm font-bold">
                              Winner #{assignedRank}
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <button
                                onClick={() => selectWinner(1, participant)}
                                className="bg-yellow-600 hover:bg-yellow-700 text-black px-2 py-1 rounded text-xs font-bold transition-colors"
                                title="Assign to 1st Place"
                              >
                                1st
                              </button>
                              <button
                                onClick={() => selectWinner(2, participant)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                                title="Assign to 2nd Place"
                              >
                                2nd
                              </button>
                              <button
                                onClick={() => selectWinner(3, participant)}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                                title="Assign to 3rd Place"
                              >
                                3rd
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Eligible Participants Section */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">
              Eligible Participants 
              <span className="text-sm text-gray-400 ml-2">
                ({topParticipants.length} qualified)
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading participants...</p>
            </div>
          ) : topParticipants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Eligible Participants</h3>
              <p className="text-gray-400">
                No participants have completed all required check-ins with the correct proof format.
              </p>
              {challenge && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg text-sm">
                  <p className="text-gray-300">
                    <strong>Requirements:</strong> {challenge.requiredCheckIns} check-ins with {challenge.proofType.toLowerCase()} proof
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {topParticipants.map((participant, index) => {
                const isAssigned = winners.some(w => w.participant?.id === participant.id);
                const assignedRank = winners.find(w => w.participant?.id === participant.id)?.rank;
                
                return (
                  <div key={participant.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold">
                          {participant.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{participant.name}</h3>
                          <p className="text-sm text-gray-400">{participant.email}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs">
                            <span className="text-green-400">
                              ✓ {participant.completedCheckIns}/{participant.requiredCheckIns} check-ins
                            </span>
                            <span className="text-blue-400">
                              {participant.completionRate}% completion
                            </span>
                            <span className="text-yellow-400">
                              {participant.points} points
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => loadParticipantProofs(participant)}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded hover:bg-gray-600"
                          title="View Proofs"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        
                        {isAssigned ? (
                          <div className="bg-yellow-600 text-black px-3 py-1 rounded-full text-sm font-bold">
                            Winner #{assignedRank}
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => selectWinner(1, participant)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-black px-2 py-1 rounded text-xs font-bold transition-colors"
                              title="Assign to 1st Place"
                            >
                              🥇 1st
                            </button>
                            <button
                              onClick={() => selectWinner(2, participant)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                              title="Assign to 2nd Place"
                            >
                              🥈 2nd
                            </button>
                            <button
                              onClick={() => selectWinner(3, participant)}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                              title="Assign to 3rd Place"
                            >
                              🥉 3rd
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Proof Modal */}
        {showProofModal && selectedParticipant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h3 className="text-xl font-bold">
                  Proofs for {selectedParticipant.name}
                </h3>
                <button
                  onClick={() => setShowProofModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {participantProofs.length > 0 ? (
                  <div className="space-y-4">
                    {participantProofs.map((proof) => (
                      <div key={proof.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-400" />
                            <span className="font-medium">Day {proof.day}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-gray-400">
                              {new Date(proof.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {proof.proofText && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-300">{proof.proofText}</p>
                          </div>
                        )}
                        
                        {proof.proofImage && (
                          <div className="mb-3">
                            <img 
                              src={proof.proofImage} 
                              alt="Proof"
                              className="max-w-full h-auto rounded-lg border border-gray-600"
                            />
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Status: {proof.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No proofs submitted yet</p>
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
