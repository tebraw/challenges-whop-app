"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Save, Crown, Medal, Award, Mail, Send, Eye, X, Calendar, CheckCircle, Users, Copy, Check, Download, ZoomIn, Package } from "lucide-react";
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
  whopUserId?: string;
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
  const [participantProofs, setParticipantProofs] = useState<any[]>([]);
  const [participantCheckins, setParticipantCheckins] = useState<any[]>([]);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedItems, setCopiedItems] = useState<{[key: string]: boolean}>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageZoomLevel, setImageZoomLevel] = useState<number>(1);
  const [sendingNotifications, setSendingNotifications] = useState<{[key: string]: boolean}>({});

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
      
      // Load eligible participants specifically for winners selection (FIXED: Use all-participants API)
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const response = await fetch(`/api/admin/challenges/${id}/all-participants?cache=${timestamp}&v=${random}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChallenge(data.challenge);
        
        // Set top participants from all participants (both eligible and ineligible)
        if (data.allParticipants && data.allParticipants.length > 0) {
          setTopParticipants(data.allParticipants);
          
          // Auto-assign top 3 eligible participants to winner slots
          const eligibleParticipants = data.allParticipants.filter((p: any) => p.isEligible);
          const autoWinners = winners.map((winner, index) => ({
            ...winner,
            participant: eligibleParticipants[index] || null
          }));
          setWinners(autoWinners);
        }
      } else {
        console.error('Failed to load participants:', response.statusText);
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
      setLoadingProofs(true);
      setShowProofModal(true);
      
      console.log(`Loading proofs for participant: ${participant.id}`);
      
      const response = await fetch(`/api/admin/users/${participant.id}/challenges/${challengeId}`, {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Participant data loaded:', data);
        console.log('Debug info:', data.debug);
        console.log('Raw proofs data:', data.enrollment?.proofs);
        console.log('Raw checkins data:', data.enrollment?.checkins);
        
        // Set both proofs and checkins
        const proofs = data.enrollment?.proofs || [];
        const checkins = data.enrollment?.checkins || [];
        
        // Sort proofs and checkins by date (newest first)
        const sortedProofs = proofs.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const sortedCheckins = checkins.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setParticipantProofs(sortedProofs);
        setParticipantCheckins(sortedCheckins);
        
        console.log('Set proofs state:', proofs);
        console.log('Set checkins state:', checkins);
        
        if (proofs.length === 0 && checkins.length === 0) {
          console.log('No proofs or checkins found for participant');
          console.log('Expected data in proofs table, got:', data.debug?.proofsCount || 0);
          console.log('Expected data in checkins table, got:', data.debug?.checkinCount || 0);
        } else {
          console.log('Found data - Proofs:', proofs.length, 'Checkins:', checkins.length);
        }
      } else {
        console.error('Failed to load participant data:', response.statusText);
        setParticipantProofs([]);
        setParticipantCheckins([]);
      }
    } catch (error) {
      console.error('Error loading participant proofs:', error);
      setParticipantProofs([]);
      setParticipantCheckins([]);
    } finally {
      setLoadingProofs(false);
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

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [itemId]: true }));
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [itemId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      alert('❌ Failed to copy text');
    }
  };

  const copyUsername = (participant: Participant) => {
    copyToClipboard(participant.name, `username-${participant.id}`);
  };

  const copyWinnerMessage = (winner: Winner) => {
    if (!winner.participant) return;
    
    const message = winner.customMessage || 
      `🏆 Congratulations ${winner.participant.name}! You won ${getPlaceText(winner.rank).text}!`;
    
    copyToClipboard(message, `message-${winner.rank}`);
  };

  const sendWhopNotification = async (winner: Winner) => {
    if (!winner.participant) return;

    const notificationKey = `notification-${winner.rank}`;
    setSendingNotifications(prev => ({ ...prev, [notificationKey]: true }));

    try {
      const message = winner.customMessage || 
        `🏆 Congratulations ${winner.participant.name}! You won ${getPlaceText(winner.rank).text}!`;

      const response = await fetch('/api/whop/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whopUserId: winner.participant.whopUserId,
          message: message,
          title: `🏆 ${challenge?.title || 'Challenge'} - Winner Announcement`,
          challengeTitle: challenge?.title,
          deepLink: `/challenges/${challengeId}`
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Whop notification sent:', result);
        alert(`✅ Notification sent to ${winner.participant.name} via Whop!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('❌ Error sending Whop notification:', error);
      alert(`❌ Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingNotifications(prev => ({ ...prev, [notificationKey]: false }));
    }
  };

  const downloadImage = async (imageUrl: string, filename?: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `proof-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('❌ Failed to download image');
    }
  };

  const downloadAllImages = async () => {
    if (!selectedParticipant) return;
    
    try {
      // Filter proofs that have images (URLs)
      const imageProofs = participantProofs.filter(proof => proof.url || proof.image);
      const checkinImages = participantCheckins.filter(checkin => checkin.imageUrl);
      
      if (imageProofs.length === 0 && checkinImages.length === 0) {
        alert('No images found to download');
        return;
      }

      // Download images sequentially with delay
      let counter = 1;
      
      for (const proof of imageProofs) {
        const imageUrl = proof.url || proof.image;
        if (imageUrl) {
          await downloadImage(imageUrl, `${selectedParticipant.name}-proof-${counter}.jpg`);
          counter++;
          await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
        }
      }
      
      for (const checkin of checkinImages) {
        if (checkin.imageUrl) {
          await downloadImage(checkin.imageUrl, `${selectedParticipant.name}-checkin-${counter}.jpg`);
          counter++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      alert(`✅ Downloaded ${counter - 1} images for ${selectedParticipant.name}`);
    } catch (error) {
      console.error('Failed to download all images:', error);
      alert('❌ Failed to download all images');
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
    setImageZoomLevel(1); // Reset zoom when opening new image
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setShowImageModal(false);
    setImageZoomLevel(1);
  };

  const adjustImageZoom = (delta: number) => {
    setImageZoomLevel(prev => Math.max(0.25, Math.min(3, prev + delta)));
  };

  const resetImageZoom = () => {
    setImageZoomLevel(1);
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
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{winner.participant.name}</span>
                                <button
                                  onClick={() => copyUsername(winner.participant!)}
                                  className="text-gray-400 hover:text-white transition-colors p-1"
                                  title="Copy username"
                                >
                                  {copiedItems[`username-${winner.participant.id}`] ? 
                                    <Check className="h-4 w-4 text-green-400" /> : 
                                    <Copy className="h-4 w-4" />
                                  }
                                </button>
                              </div>
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
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => copyWinnerMessage(winner)}
                              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              {copiedItems[`message-${winner.rank}`] ? 
                                <>
                                  <Check className="h-4 w-4" />
                                  Copied!
                                </> : 
                                <>
                                  <Copy className="h-4 w-4" />
                                  Copy Message
                                </>
                              }
                            </button>
                            <button
                              onClick={() => sendWhopNotification(winner)}
                              disabled={sendingNotifications[`notification-${winner.rank}`] || !winner.participant?.whopUserId}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              {sendingNotifications[`notification-${winner.rank}`] ? 
                                <>
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                  Sending...
                                </> : 
                                <>
                                  <Send className="h-4 w-4" />
                                  Send via Whop
                                </>
                              }
                            </button>
                          </div>
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
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{participant.name}</h3>
                            <button
                              onClick={() => copyUsername(participant)}
                              className="text-gray-400 hover:text-white transition-colors p-1"
                              title="Copy username"
                            >
                              {copiedItems[`username-${participant.id}`] ? 
                                <Check className="h-4 w-4 text-green-400" /> : 
                                <Copy className="h-4 w-4" />
                              }
                            </button>
                          </div>
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
                <div className="flex items-center gap-3">
                  {(participantProofs.some(p => p.url || p.image) || participantCheckins.some(c => c.imageUrl)) && (
                    <button
                      onClick={downloadAllImages}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Package className="h-4 w-4" />
                      Download All
                    </button>
                  )}
                  <button
                    onClick={() => setShowProofModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingProofs ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Loading proofs...</p>
                  </div>
                ) : (
                  <>
                    {/* Proofs Section */}
                    {participantProofs.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-4 text-white">Submitted Proofs</h4>
                        <div className="space-y-4">
                          {participantProofs.map((proof) => (
                            <div key={proof.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Award className="h-4 w-4 text-purple-400" />
                                  <span className="font-medium text-white">Proof #{proof.id.slice(-6)}</span>
                                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                    {proof.type || 'GENERAL'}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-300">
                                    {new Date(proof.createdAt).toLocaleDateString('de-DE')}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {new Date(proof.createdAt).toLocaleTimeString('de-DE')}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Text Content */}
                              {proof.text && (
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-300">📝 Text Proof:</span>
                                    <button
                                      onClick={() => copyToClipboard(proof.text, `proof-text-${proof.id}`)}
                                      className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                    >
                                      {copiedItems[`proof-text-${proof.id}`] ? (
                                        <>
                                          <Check className="h-3 w-3" />
                                          Copied!
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-3 w-3" />
                                          Copy
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <div className="bg-gray-800 p-3 rounded border border-gray-600">
                                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{proof.text}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Image Content */}
                              {(proof.image || proof.url) && (
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-green-300">🖼️ Image Proof:</span>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => downloadImage(proof.image || proof.url, `proof-${proof.id.slice(-6)}.jpg`)}
                                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                      >
                                        <Download className="h-3 w-3" />
                                        Download
                                      </button>
                                    </div>
                                  </div>
                                  <div className="relative group">
                                    <img 
                                      src={proof.image || proof.url} 
                                      alt="Proof"
                                      className="max-w-full h-auto rounded-lg border border-gray-600 max-h-64 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => openImageModal(proof.image || proof.url)}
                                    />
                                    {/* Image overlay with actions */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openImageModal(proof.image || proof.url);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors shadow-lg"
                                        title="View Full Size"
                                      >
                                        <ZoomIn className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Link Content */}
                              {proof.url && !proof.image && (
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-cyan-300">🔗 Link Proof:</span>
                                    <button
                                      onClick={() => copyToClipboard(proof.url, `proof-url-${proof.id}`)}
                                      className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                    >
                                      {copiedItems[`proof-url-${proof.id}`] ? (
                                        <>
                                          <Check className="h-3 w-3" />
                                          Copied!
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-3 w-3" />
                                          Copy URL
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <div className="bg-gray-800 p-3 rounded border border-gray-600">
                                    <a 
                                      href={proof.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-cyan-400 hover:text-cyan-300 text-sm underline break-all"
                                    >
                                      {proof.url}
                                    </a>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-600 pt-2">
                                <span>Version: {proof.version || '1'}</span>
                                <span>ID: {proof.id}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Checkins Section */}
                    {participantCheckins.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-4 text-white">Daily Check-ins</h4>
                        <div className="space-y-4">
                          {participantCheckins.map((checkin) => (
                            <div key={checkin.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                  <span className="font-medium text-white">Check-in Day {checkin.day || 'Unknown'}</span>
                                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                    {checkin.status || 'SUBMITTED'}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-300">
                                    {new Date(checkin.createdAt).toLocaleDateString('de-DE')}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {new Date(checkin.createdAt).toLocaleTimeString('de-DE')}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Text Content */}
                              {checkin.text && (
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-300">📝 Check-in Text:</span>
                                    <button
                                      onClick={() => copyToClipboard(checkin.text, `checkin-text-${checkin.id}`)}
                                      className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                    >
                                      {copiedItems[`checkin-text-${checkin.id}`] ? (
                                        <>
                                          <Check className="h-3 w-3" />
                                          Copied!
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-3 w-3" />
                                          Copy
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <div className="bg-gray-800 p-3 rounded border border-gray-600">
                                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{checkin.text}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Image Content */}
                              {checkin.imageUrl && (
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-green-300">🖼️ Check-in Image:</span>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => downloadImage(checkin.imageUrl, `checkin-${checkin.id.slice(-6)}.jpg`)}
                                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                      >
                                        <Download className="h-3 w-3" />
                                        Download
                                      </button>
                                    </div>
                                  </div>
                                  <div className="relative group">
                                    <img 
                                      src={checkin.imageUrl} 
                                      alt="Check-in"
                                      className="max-w-full h-auto rounded-lg border border-gray-600 max-h-64 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => openImageModal(checkin.imageUrl)}
                                    />
                                    {/* Image overlay with actions */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openImageModal(checkin.imageUrl);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors shadow-lg"
                                        title="View Full Size"
                                      >
                                        <ZoomIn className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Link Content */}
                              {checkin.linkUrl && (
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-cyan-300">🔗 Check-in Link:</span>
                                    <button
                                      onClick={() => copyToClipboard(checkin.linkUrl, `checkin-url-${checkin.id}`)}
                                      className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                    >
                                      {copiedItems[`checkin-url-${checkin.id}`] ? (
                                        <>
                                          <Check className="h-3 w-3" />
                                          Copied!
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-3 w-3" />
                                          Copy URL
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <div className="bg-gray-800 p-3 rounded border border-gray-600">
                                    <a 
                                      href={checkin.linkUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-cyan-400 hover:text-cyan-300 text-sm underline break-all"
                                    >
                                      {checkin.linkUrl}
                                    </a>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-600 pt-2">
                                <span>Check-in #{checkin.day || 'Unknown'}</span>
                                <span>ID: {checkin.id}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Data Message */}
                    {participantProofs.length === 0 && participantCheckins.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">No proofs or check-ins submitted yet</div>
                        <div className="text-sm text-gray-500 mb-4">
                          Participant: {selectedParticipant.email}
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Debug Info:</div>
                          <div>Proofs found: {participantProofs.length}</div>
                          <div>Check-ins found: {participantCheckins.length}</div>
                          <div>This participant may not have submitted any proofs yet</div>
                          <div className="mt-2 p-2 bg-gray-700 rounded text-left">
                            <div className="text-gray-300 font-medium">Troubleshooting:</div>
                            <div>1. Check if participant has submitted proofs via the challenge page</div>
                            <div>2. Verify the challenge allows proof submissions</div>
                            <div>3. Check browser console for API errors</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Zoom Modal */}
        {showImageModal && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Top Controls */}
              <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-4 z-10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadImage(selectedImage, `proof-fullsize-${Date.now()}.jpg`)}
                    className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                    title="Download Full Size"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(selectedImage, 'image-url')}
                    className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                    title="Copy Image URL"
                  >
                    {copiedItems['image-url'] ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <button
                  onClick={closeImageModal}
                  className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-60 backdrop-blur-sm rounded-full px-4 py-2 z-10">
                <button
                  onClick={() => adjustImageZoom(-0.25)}
                  disabled={imageZoomLevel <= 0.25}
                  className="text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-2"
                  title="Zoom Out"
                >
                  <span className="text-xl font-bold">−</span>
                </button>
                <button
                  onClick={resetImageZoom}
                  className="text-white hover:text-gray-300 transition-colors px-3 py-1 text-sm font-medium"
                  title="Reset Zoom"
                >
                  {Math.round(imageZoomLevel * 100)}%
                </button>
                <button
                  onClick={() => adjustImageZoom(0.25)}
                  disabled={imageZoomLevel >= 3}
                  className="text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-2"
                  title="Zoom In"
                >
                  <span className="text-xl font-bold">+</span>
                </button>
              </div>

              {/* Image Container */}
              <div 
                className="overflow-auto max-w-full max-h-full cursor-pointer"
                onClick={closeImageModal}
              >
                <img
                  src={selectedImage}
                  alt="Full Size Proof"
                  className="transition-transform duration-200 block mx-auto"
                  style={{ 
                    transform: `scale(${imageZoomLevel})`,
                    maxWidth: imageZoomLevel > 1 ? 'none' : '100%',
                    maxHeight: imageZoomLevel > 1 ? 'none' : '100%'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  draggable={false}
                />
              </div>

              {/* Hint Text */}
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-70 bg-black bg-opacity-60 backdrop-blur-sm px-3 py-1 rounded">
                Click anywhere to close • Use zoom controls to adjust size
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
