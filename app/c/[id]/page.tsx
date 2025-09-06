"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, Upload, Trophy, ArrowLeft, Flame, CheckCircle, Clock, Star } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface ChallengeData {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  proofType: string;
  cadence: string;
  imageUrl?: string;
  rules?: any;
  participantCount: number;
  status: 'upcoming' | 'active' | 'ended';
  progress: {
    totalDays: number;
    daysElapsed: number;
    daysRemaining: number;
  };
}

interface UserParticipation {
  isParticipating: boolean;
  stats?: {
    currentStreak: number;
    totalCheckIns: number;
    canCheckInToday: boolean;
    hasCheckedInToday: boolean;
    joinedAt: string;
    lastCheckin?: string;
  };
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  currentStreak: number;
  totalCheckIns: number;
  points: number;
}

export default function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [userParticipation, setUserParticipation] = useState<UserParticipation>({ isParticipating: false });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [proofText, setProofText] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [challengeId, setChallengeId] = useState<string>("");

  useEffect(() => {
    async function loadChallenge() {
      try {
        const resolvedParams = await params;
        setChallengeId(resolvedParams.id);
        
        // Load challenge status
        const statusResponse = await fetch(`/api/challenges/${resolvedParams.id}/status`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setChallenge(statusData.challenge);
          setUserParticipation(statusData.userParticipation);
        }

        // Load leaderboard
        const leaderboardResponse = await fetch(`/api/challenges/${resolvedParams.id}/leaderboard`);
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          setLeaderboard(leaderboardData.leaderboard.slice(0, 10)); // Top 10
        }
        
      } catch (error) {
        console.error("Error loading challenge:", error);
      } finally {
        setLoading(false);
      }
    }

    loadChallenge();
  }, [params]);

  const handleJoinChallenge = async () => {
    if (!challengeId) return;
    
    // Show terms modal first
    setShowTermsModal(true);
  };

  const handleAcceptTermsAndJoin = async () => {
    setShowTermsModal(false);
    
    try {
      setJoining(true);
      const response = await fetch(`/api/challenges/${challengeId}/join`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (response.ok) {
        window.location.reload();
      } else {
        alert(data.error || 'Failed to join challenge');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      alert('Failed to join challenge');
    } finally {
      setJoining(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!challengeId) return;

    try {
      setSubmittingProof(true);
      
      let proofData: any = {};
      
      if (challenge?.proofType === 'TEXT') {
        if (!proofText.trim()) {
          alert('Please enter your proof text');
          return;
        }
        proofData.text = proofText.trim();
      } else if (challenge?.proofType === 'LINK') {
        if (!proofLink.trim()) {
          alert('Please enter a valid link');
          return;
        }
        proofData.linkUrl = proofLink.trim();
      } else if (challenge?.proofType === 'PHOTO') {
        if (!selectedFile) {
          alert('Please select a photo');
          return;
        }
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photo');
        }
        
        const uploadData = await uploadResponse.json();
        proofData.imageUrl = uploadData.url;
      }

      const response = await fetch(`/api/challenges/${challengeId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proofData)
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Check-in erfolgreich! 🎉');
        setShowProofModal(false);
        setProofText('');
        setProofLink('');
        setSelectedFile(null);
        window.location.reload();
      } else {
        alert(data.error || 'Failed to submit proof');
      }
    } catch (error) {
      console.error('Error submitting proof:', error);
      alert('Failed to submit proof');
    } finally {
      setSubmittingProof(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    if (!challenge) return null;
    
    if (challenge.status === 'upcoming') {
      return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">Starting Soon</span>;
    } else if (challenge.status === 'active') {
      return <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full flex items-center gap-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        Live
      </span>;
    } else {
      return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-sm rounded-full">Ended</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Challenge not found</h1>
          <p className="text-gray-400 mb-8">The challenge you're looking for doesn't exist.</p>
          <Link href="/discover">
            <Button className="bg-purple-600 hover:bg-purple-700">Discover Challenges</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/discover" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Challenges
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{challenge.title}</h1>
                {getStatusBadge()}
              </div>
              
              <p className="text-gray-300 text-base lg:text-lg mb-6 max-w-3xl">{challenge.description}</p>
              
              {/* Rewards Section */}
              {challenge.rules?.rewards && Array.isArray(challenge.rules.rewards) && challenge.rules.rewards.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Rewards & Prizes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {challenge.rules.rewards.map((reward: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg p-4 text-center"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 text-black font-bold text-sm rounded-full mb-2 mx-auto">
                          #{reward.place || index + 1}
                        </div>
                        <h4 className="font-semibold text-yellow-200 text-sm mb-1">
                          {reward.place === 1 ? '🥇 1st Place' : 
                           reward.place === 2 ? '🥈 2nd Place' : 
                           reward.place === 3 ? '🥉 3rd Place' : 
                           `🏆 Place ${reward.place || index + 1}`}
                        </h4>
                        <p className="text-gray-300 text-sm font-medium mb-1">
                          {reward.title}
                        </p>
                        {reward.desc && (
                          <p className="text-gray-400 text-xs">
                            {reward.desc}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">{formatDate(challenge.startAt)} - {formatDate(challenge.endAt)}</span>
                  <span className="sm:hidden">{new Date(challenge.startAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - {new Date(challenge.endAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {challenge.participantCount} Participants
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {challenge.progress.totalDays} Days
                </span>
              </div>
            </div>
            
            {userParticipation.isParticipating && (
              <div className="mt-4 lg:mt-0 lg:ml-6 w-full lg:w-auto">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 rounded-full text-sm font-medium text-center lg:text-left">
                  ✨ You're participating!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {userParticipation.isParticipating ? (
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                        <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                        Your Progress
                      </h2>
                      <div className="text-center sm:text-right">
                        <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                          {userParticipation.stats?.currentStreak || 0}
                        </div>
                        <p className="text-sm text-gray-400">Day Streak</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                      <div className="text-center p-3 sm:p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                        <div className="text-lg sm:text-2xl font-bold text-blue-400 mb-1">
                          {userParticipation.stats?.totalCheckIns || 0}
                        </div>
                        <p className="text-xs text-gray-400">Check-ins</p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                        <div className="text-lg sm:text-2xl font-bold text-green-400 mb-1">
                          {challenge.progress.daysRemaining}
                        </div>
                        <p className="text-xs text-gray-400">Days left</p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                        <div className="text-lg sm:text-2xl font-bold text-purple-400 mb-1">
                          {Math.round(((userParticipation.stats?.totalCheckIns || 0) / (challenge.progress.daysElapsed || 1)) * 100) || 0}%
                        </div>
                        <p className="text-xs text-gray-400">Success Rate</p>
                      </div>
                    </div>

                    {userParticipation.stats?.canCheckInToday && challenge.status === 'active' && (
                      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                          <Upload className="w-5 h-5" />
                          Submit Today's Proof
                        </h3>
                        <p className="text-gray-300 mb-4">
                          Proof Type: <span className="font-semibold text-white">{challenge.proofType}</span>
                        </p>
                        <Button 
                          onClick={() => setShowProofModal(true)}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 text-lg"
                        >
                          Submit Proof Now! 🚀
                        </Button>
                      </div>
                    )}

                    {userParticipation.stats?.hasCheckedInToday && (
                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
                        <div className="flex items-center gap-3 text-green-400 mb-2">
                          <CheckCircle className="w-6 h-6" />
                          <span className="font-bold text-lg">Already completed today! 🎉</span>
                        </div>
                        <p className="text-gray-300">Come back tomorrow to continue your streak</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                <div className="p-8 text-center">
                  <div className="mb-6">
                    <div className="text-6xl mb-4">🎯</div>
                    <h2 className="text-3xl font-bold mb-4">Ready to join?</h2>
                    <p className="text-gray-300 text-lg max-w-md mx-auto">
                      Join this challenge and start your journey today!
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-lg mx-auto">
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <div className="text-2xl mb-2">💪</div>
                      <h3 className="font-semibold text-blue-400 mb-1">Challenge</h3>
                      <p className="text-sm text-gray-400">Build consistency and reach your goals</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <div className="text-2xl mb-2">🏆</div>
                      <h3 className="font-semibold text-green-400 mb-1">Recognition</h3>
                      <p className="text-sm text-gray-400">Compete with others and win prizes</p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleJoinChallenge}
                    disabled={joining || challenge.status !== 'active'}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 text-lg disabled:opacity-50"
                  >
                    {joining ? 'Joining...' : challenge.status === 'active' ? '🚀 Join Challenge' : 'Challenge not active'}
                  </Button>
                </div>
              </Card>
            )}

            <Card className="bg-gray-900 border-gray-800">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Leaderboard
                </h2>
                
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🏁</div>
                    <p className="text-gray-400 text-lg">No participants yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((participant, index) => (
                      <div 
                        key={participant.userId}
                        className={`flex items-center justify-between p-4 rounded-xl ${
                          index < 3 
                            ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30' 
                            : 'bg-gray-800/50 border border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' :
                            index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black' :
                            index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-black' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {index < 3 ? (
                              index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
                            ) : (
                              participant.rank
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{participant.username}</p>
                            <p className="text-sm text-gray-400">
                              {participant.currentStreak} Day Streak • {participant.totalCheckIns} Check-ins
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-bold text-lg text-purple-400">{participant.points}</span>
                          </div>
                          <p className="text-xs text-gray-400">Points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <div className="p-6">
                <h3 className="font-bold text-lg mb-4">Challenge Details</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Duration:</span>
                    <span className="font-semibold">{challenge.progress.totalDays} Days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Participants:</span>
                    <span className="font-semibold">{challenge.participantCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Proof Type:</span>
                    <span className="font-semibold">{challenge.proofType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Frequency:</span>
                    <span className="font-semibold">{challenge.cadence}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500/20">
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">💪</div>
                <h3 className="font-bold text-lg mb-2">Stay strong!</h3>
                <p className="text-gray-300 text-sm">
                  Every day you complete brings you closer to your goal. You've got this!
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {showProofModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-700">
            <h3 className="text-2xl font-bold mb-6 text-center">Submit Proof</h3>
            
            {challenge.proofType === 'TEXT' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Describe your progress today:
                </label>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-white resize-none focus:ring-2 focus:ring-purple-500"
                  rows={4}
                  placeholder="Share details about your progress..."
                />
              </div>
            )}

            {challenge.proofType === 'LINK' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Share a link as proof:
                </label>
                <input
                  type="url"
                  value={proofLink}
                  onChange={(e) => setProofLink(e.target.value)}
                  className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                />
              </div>
            )}

            {challenge.proofType === 'PHOTO' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Upload a photo as proof:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-400 mt-2">Selected: {selectedFile.name}</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setShowProofModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitProof}
                disabled={submittingProof}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-3"
              >
                {submittingProof ? 'Submitting...' : 'Submit Proof'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Policy Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-2xl font-bold mb-4 text-center">Terms & Policy</h3>
            
            <div className="flex-1 overflow-y-auto mb-6 pr-2">
              <div className="prose prose-gray prose-invert max-w-none">
                {challenge.rules?.policy ? (
                  <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                    {challenge.rules.policy}
                  </div>
                ) : (
                  <div className="text-gray-300 text-sm">
                    <p className="mb-4">By joining this challenge, you agree to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Participate honestly and submit genuine proof of completion</li>
                      <li>Follow the challenge requirements and guidelines</li>
                      <li>Respect other participants and maintain a positive environment</li>
                      <li>Accept that rewards are distributed based on performance and completion</li>
                      <li>Understand that participation is voluntary and you can withdraw at any time</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowTermsModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAcceptTermsAndJoin}
                disabled={joining}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-3"
              >
                {joining ? 'Joining...' : 'Accept & Join Challenge'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}