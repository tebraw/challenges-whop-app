"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Trophy, Medal, Award, Eye, ArrowLeft, Mail, Check, Star, Clock, Calendar, Image, FileText, Link as LinkIcon, AlertTriangle } from "lucide-react";

interface Participant {
  id: string;
  userId: string;
  user: { 
    id: string;
    name: string; 
    email: string; 
  };
  completedDays: number;
  totalDays: number;
  completionRate: number;
  currentStreak: number;
  maxStreak: number;
  hasCompletedChallenge: boolean;
  hasDuplicates?: boolean;
  submissions: Array<{
    id: string;
    day: number;
    createdAt: string;
    content: string;
    mediaUrl?: string;
    proofType: "TEXT" | "PHOTO" | "LINK";
    fileName?: string;
    fileSize?: number;
  }>;
}

interface Winner {
  place: number;
  userId: string;
  participantId: string;
  userName: string;
}

interface WinnerNotification {
  place: number;
  message: string;
  sent: boolean;
  sending: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  status: string;
}

export default function WinnerSelectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [selectedRank, setSelectedRank] = useState<number>(1);
  const [notifications, setNotifications] = useState<Record<number, WinnerNotification>>({});
  
  const id = params?.id;
  
  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      const [challengeRes, participantsRes, winnersRes] = await Promise.all([
        fetch(`/api/challenges/${id}`),
        fetch(`/api/challenges/${id}/participants-detailed`),
        fetch(`/api/challenges/${id}/winners`)
      ]);
      
      const challengeData = await challengeRes.json();
      const participantsData = await participantsRes.json();
      const winnersData = await winnersRes.json();
      
      setChallenge(challengeData.challenge);
      
      // Duplikat-Erkennung für alle Teilnehmer
      const participantsWithDuplicateCheck = participantsData.participants?.map((participant: Participant) => ({
        ...participant,
        hasDuplicates: checkForDuplicates(participant.submissions)
      })) || [];
      
      setParticipants(participantsWithDuplicateCheck);
      setWinners(winnersData.winners || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  };

  // Duplikat-Erkennung Funktion
  const checkForDuplicates = (submissions: Participant['submissions']): boolean => {
    if (submissions.length <= 1) return false;

    const submissionMap = new Map<string, number>();

    for (const submission of submissions) {
      let key: string;

      switch (submission.proofType) {
        case 'PHOTO':
          // Für Fotos: fileName + fileSize als Duplikat-Key
          if (submission.fileName && submission.fileSize) {
            key = `${submission.fileName}_${submission.fileSize}`;
          } else {
            key = submission.mediaUrl || submission.content;
          }
          break;
        
        case 'TEXT':
          // Für Text: Exakter Textinhalt (whitespace getrimmt und lowercase)
          key = submission.content.trim().toLowerCase();
          break;
        
        case 'LINK':
          // Für Links: URL normalisiert (ohne trailing slash, lowercase)
          key = submission.content.trim().toLowerCase().replace(/\/$/, '');
          break;
        
        default:
          key = submission.content;
      }

      const count = submissionMap.get(key) || 0;
      submissionMap.set(key, count + 1);

      // Wenn ein Key mehr als einmal vorkommt, sind Duplikate vorhanden
      if (count >= 1) {
        return true;
      }
    }

    return false;
  };

  // Randomisierungsfunktion für Gleichstand
  const shuffleArray = function<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Top 5 Teilnehmer mit 100% Completion Rate (Auto-Suggestions)
  const topCompletedParticipants = participants
    .filter(p => p.hasCompletedChallenge && !p.hasDuplicates) // Keine Duplikate
    .sort((a, b) => {
      // Sortiere nach: 1. Completion Rate, 2. Max Streak, 3. Anzahl Submissions
      if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
      if (b.maxStreak !== a.maxStreak) return b.maxStreak - a.maxStreak;
      return b.submissions.length - a.submissions.length;
    })
    .reduce((acc, participant, index, array) => {
      // Gruppiere Teilnehmer mit identischen Werten für Randomisierung
      const current = participant;
      const currentKey = `${current.completionRate}_${current.maxStreak}_${current.submissions.length}`;
      
      if (index === 0) {
        // Erster Teilnehmer - starte neue Gruppe
        acc.push([current]);
      } else {
        const previous = array[index - 1];
        const previousKey = `${previous.completionRate}_${previous.maxStreak}_${previous.submissions.length}`;
        
        if (currentKey === previousKey) {
          // Gleiche Werte - füge zur letzten Gruppe hinzu
          acc[acc.length - 1].push(current);
        } else {
          // Andere Werte - starte neue Gruppe
          acc.push([current]);
        }
      }
      
      return acc;
    }, [] as Participant[][])
    .map(group => shuffleArray(group)) // Randomisiere jede Gruppe
    .flat() // Flach machen zu einer Liste
    .slice(0, 5); // Nur die Top 5

  // Alle anderen Teilnehmer mit 100% Completion (ohne Duplikate)
  const otherCompletedParticipants = participants
    .filter(p => p.hasCompletedChallenge && !p.hasDuplicates && !topCompletedParticipants.includes(p))
    .sort((a, b) => b.completionRate - a.completionRate);

  const selectWinner = (place: number, participant: Participant) => {
    const newWinners = winners.filter(w => w.place !== place);
    newWinners.push({
      place,
      userId: participant.user.id,
      participantId: participant.id,
      userName: participant.user.name
    });
    setWinners(newWinners.sort((a, b) => a.place - b.place));
    
    // Create default notification message
    const placeText = getPlaceLabel(place);
    const defaultMessage = `🎉 Congratulations! You won ${placeText} in "${challenge?.title || 'this challenge'}"!`;
    
    setNotifications(prev => ({
      ...prev,
      [place]: {
        place,
        message: defaultMessage,
        sent: false,
        sending: false
      }
    }));
  };

  const removeWinner = (place: number) => {
    setWinners(winners.filter(w => w.place !== place));
    // Remove notification for this place
    setNotifications(prev => {
      const newNotifications = { ...prev };
      delete newNotifications[place];
      return newNotifications;
    });
  };

  const updateNotificationMessage = (place: number, message: string) => {
    setNotifications(prev => ({
      ...prev,
      [place]: {
        ...prev[place],
        message
      }
    }));
  };

  const sendNotification = async (place: number) => {
    const winner = winners.find(w => w.place === place);
    const notification = notifications[place];
    
    if (!winner || !notification) return;

    // Get participant to find email for Whop ID lookup
    const participant = participants.find(p => p.user.id === winner.userId);
    if (!participant) return;

    setNotifications(prev => ({
      ...prev,
      [place]: { ...prev[place], sending: true }
    }));

    try {
      const response = await fetch(`/api/whop/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: participant.user.email,
          message: notification.message,
          title: `Challenge Winner - ${getPlaceLabel(place)}`
        })
      });

      if (response.ok) {
        setNotifications(prev => ({
          ...prev,
          [place]: { ...prev[place], sent: true, sending: false }
        }));
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
      setNotifications(prev => ({
        ...prev,
        [place]: { ...prev[place], sending: false }
      }));
    }
  };

  const viewSubmissions = (participant: Participant) => {
    setSelectedParticipant(participant);
    setShowSubmissions(true);
  };

  const saveWinners = async () => {
    if (!id) return;
    
    if (winners.length === 0) {
      alert('Please select at least one winner');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/challenges/${id}/winners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winners })
      });

      if (!response.ok) {
        throw new Error('Failed to save winners');
      }

      // Erfolg - zurück zur Admin Seite
      router.push('/admin?success=Winners saved successfully!');
    } catch (error) {
      console.error('Error saving winners:', error);
      alert('Failed to save winners. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getPlaceIcon = (place: number) => {
    switch (place) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <Star className="h-5 w-5 text-purple-500" />;
    }
  };

  const getPlaceLabel = (place: number) => {
    switch (place) {
      case 1: return '1st Place';
      case 2: return '2nd Place'; 
      case 3: return '3rd Place';
      default: return `${place}th Place`;
    }
  };

  const getProofIcon = (proofType: string) => {
    switch (proofType) {
      case 'PHOTO': return <Image className="h-4 w-4 text-blue-500" />;
      case 'LINK': return <LinkIcon className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Select Challenge Winners</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {challenge?.title} • {topCompletedParticipants.length} eligible participants
        </p>
      </div>

      {/* Winners Display - Horizontal Layout */}
      <div className="mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Selected Winners
              </h2>
              <div className="flex items-center gap-4">
                {/* Rank Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Rank:
                  </label>
                  <select
                    value={selectedRank}
                    onChange={(e) => setSelectedRank(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3].map(rank => (
                      <option key={rank} value={rank}>
                        {getPlaceLabel(rank)}
                      </option>
                    ))}
                  </select>
                </div>
                {winners.length > 0 && (
                  <Button
                    onClick={saveWinners}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saving ? (
                      "Saving Winners..."
                    ) : (
                      <>
                        <Trophy className="h-4 w-4 mr-2" />
                        Save Winners
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Horizontal Places Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              {[1, 2, 3].map(place => {
                const winner = winners.find(w => w.place === place);
                return (
                  <div key={place} className={`p-6 rounded-lg border-2 ${
                    winner ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                  }`}>
                    <div className="text-center mb-4">
                      <div className="flex justify-center mb-2">
                        {getPlaceIcon(place)}
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{getPlaceLabel(place)}</h3>
                    </div>
                    
                    {winner ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-800 dark:text-green-200">
                              {winner.userName}
                            </span>
                          </div>
                          <button
                            onClick={() => removeWinner(place)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                          >
                            Remove Winner
                          </button>
                        </div>
                        
                        {/* Notification Section */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Send Notification</span>
                          </div>
                          
                          <textarea
                            value={notifications[place]?.message || ''}
                            onChange={(e) => updateNotificationMessage(place, e.target.value)}
                            placeholder="Enter winner notification message..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                          
                          <div className="mt-2">
                            <Button
                              onClick={() => sendNotification(place)}
                              disabled={notifications[place]?.sending || notifications[place]?.sent || !notifications[place]?.message?.trim()}
                              className={`w-full px-3 py-1 text-xs ${
                                notifications[place]?.sent 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-blue-600 hover:bg-blue-700'
                              } text-white`}
                            >
                              {notifications[place]?.sending ? (
                                "Sending..."
                              ) : notifications[place]?.sent ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Sent via Whop
                                </>
                              ) : (
                                <>
                                  <Mail className="h-3 w-3 mr-1" />
                                  Send via Whop
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Click on a participant below to select
                        </p>
                        <div className="w-16 h-16 mx-auto border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-gray-400 dark:text-gray-500 text-xs">Empty</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {winners.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Save winners first, then send individual notifications above
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Top Performers (Auto-Suggestions) */}
      <div className="mb-8">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              Top Performers (Auto-Suggestions)
            </h2>
            
            {/* Statistics */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {participants.filter(p => p.hasCompletedChallenge).length}
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-300">Completed Challenge</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {participants.filter(p => p.hasCompletedChallenge && !p.hasDuplicates).length}
                </div>
                <div className="text-sm text-green-800 dark:text-green-300">Eligible for Awards</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {participants.filter(p => p.hasDuplicates).length}
                </div>
                <div className="text-sm text-red-800 dark:text-red-300">With Duplicates</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {topCompletedParticipants.length}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">Auto-Suggestions</div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Based on completion rate, streak performance, and submission quality. Participants with duplicate submissions are excluded.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {topCompletedParticipants.map((participant, index) => {
                  const isSelected = winners.some(w => w.participantId === participant.id);
                  return (
                    <div
                      key={participant.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        isSelected 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800/50'
                      }`}
                      onClick={() => !isSelected && selectWinner(selectedRank, participant)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{participant.user.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{participant.user.email}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-green-600" />}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {participant.completedDays}/{participant.totalDays} days
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {participant.maxStreak} max streak
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mr-2">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${participant.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                          {participant.completionRate}%
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewSubmissions(participant);
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors"
                        >
                          <Eye className="h-3 w-3 inline mr-1" />
                          View
                        </button>
                        {!isSelected && (
                          <button
                            onClick={() => selectWinner(selectedRank, participant)}
                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 rounded transition-colors"
                          >
                            Select
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Other Completed Participants */}
        {otherCompletedParticipants.length > 0 && (
          <div className="mb-8">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    Other Eligible Participants ({otherCompletedParticipants.length})
                  </h2>
                  <button
                    onClick={() => setShowAllParticipants(!showAllParticipants)}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors"
                  >
                    {showAllParticipants ? 'Hide' : 'Show All'}
                  </button>
                </div>

                {showAllParticipants && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {otherCompletedParticipants.map((participant) => {
                      const isSelected = winners.some(w => w.participantId === participant.id);
                      return (
                        <div
                          key={participant.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                            isSelected 
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                              : participant.hasDuplicates
                              ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 opacity-75 cursor-not-allowed'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
                          }`}
                          onClick={() => !isSelected && !participant.hasDuplicates && selectWinner(selectedRank, participant)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{participant.user.name}</h3>
                            <div className="flex items-center gap-2">
                              {participant.hasDuplicates && (
                                <div className="flex items-center gap-1 text-red-600 dark:text-red-400" title="Has duplicate submissions">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-xs">Duplicates</span>
                                </div>
                              )}
                              {isSelected && <Check className="h-4 w-4 text-green-600" />}
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {participant.completedDays}/{participant.totalDays} days • {participant.maxStreak} max streak
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${participant.completionRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              {participant.completionRate}%
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewSubmissions(participant);
                              }}
                              className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded"
                            >
                              <Eye className="h-3 w-3 inline mr-1" />
                              View
                            </button>
                            {!isSelected && (
                              <button
                                onClick={() => !participant.hasDuplicates && selectWinner(selectedRank, participant)}
                                disabled={participant.hasDuplicates}
                                className={`px-2 py-1 text-xs rounded ${
                                  participant.hasDuplicates
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300'
                                }`}
                                title={participant.hasDuplicates ? 'Cannot select: Has duplicate submissions' : 'Select as winner'}
                              >
                                Select
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

      {/* Submissions Modal */}
      {showSubmissions && selectedParticipant && (
        <Modal
          open={showSubmissions}
          onClose={() => {
            setShowSubmissions(false);
            setSelectedParticipant(null);
          }}
          title={`${selectedParticipant.user.name}'s Submissions`}
        >
          <div className="max-h-96 overflow-y-auto">
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                  <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                    {selectedParticipant.completionRate}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Max Streak:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{selectedParticipant.maxStreak} days</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Submissions:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{selectedParticipant.submissions.length}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Days Completed:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                    {selectedParticipant.completedDays}/{selectedParticipant.totalDays}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {selectedParticipant.submissions
                .sort((a, b) => a.day - b.day)
                .map((submission) => (
                <div key={submission.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {submission.day}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Day {submission.day}
                      </span>
                      {getProofIcon(submission.proofType)}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(submission.createdAt)}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 mb-3">
                    <p className="text-sm text-gray-800 dark:text-gray-200">{submission.content}</p>
                  </div>

                  {submission.mediaUrl && (
                    <div className="mt-3">
                      {submission.proofType === 'PHOTO' ? (
                        <img
                          src={submission.mediaUrl}
                          alt={`Day ${submission.day} submission`}
                          className="max-w-full h-32 object-cover rounded-md"
                        />
                      ) : (
                        <a
                          href={submission.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          View Link →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowSubmissions(false);
                setSelectedParticipant(null);
              }}
            >
              Close
            </Button>
            {!winners.some(w => w.participantId === selectedParticipant.id) && (
              <Button
                onClick={() => {
                  selectWinner(selectedRank, selectedParticipant);
                  setShowSubmissions(false);
                  setSelectedParticipant(null);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Select as {getPlaceLabel(selectedRank)}
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
