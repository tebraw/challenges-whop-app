
"use client";

import { useState, useEffect, use } from "react";
import AdminLeaderboardList from "@/components/admin/AdminLeaderboardList";
import MonetizationDashboard from "@/components/admin/MonetizationDashboard";
import ParticipantSegmentation from "@/components/admin/ParticipantSegmentation";
import StreakBar from "@/components/user/StreakBar";
import { Card } from "@/components/ui/Card";
import ChallengeCountdown from "@/components/ui/ChallengeCountdown";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowLeft, Users, Lightbulb, Settings, Trophy } from "lucide-react";

interface ChallengePageProps {
  params: Promise<{ id: string }>;
}

interface Challenge {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  rules?: any;
  startAt: string;
  endAt: string;
  proofType: string;
  cadence: string;
  streakCount?: number;
  _count?: {
    enrollments: number;
  };
}

export default function Page({ params }: ChallengePageProps) {
  const resolvedParams = use(params);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getChallenge() {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
        const res = await fetch(`${base}/api/challenges/${resolvedParams.id}`);
        if (!res.ok) {
          console.error('Failed to fetch challenge:', res.status, res.statusText);
          setChallenge(null);
          return;
        }
        const data = await res.json();
        console.log('Loaded challenge:', data);
        setChallenge(data);
      } catch (error) {
        console.error('Failed to load challenge:', error);
        setChallenge(null);
      } finally {
        setLoading(false);
      }
    }

    getChallenge();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }
  if (!challenge) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-4">
          <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Admin Dashboard
          </Link>
        </div>
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Challenge nicht gefunden</h1>
          <p className="text-gray-600 mb-4">
            Die Challenge mit der ID "{resolvedParams.id}" konnte nicht gefunden werden.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Mögliche Ursachen:</p>
            <ul className="text-sm text-gray-500 text-left list-disc list-inside">
              <li>Die Challenge wurde gelöscht</li>
              <li>Die Challenge-ID ist ungültig</li>
              <li>Es gibt ein Problem mit der Datenbank-Verbindung</li>
            </ul>
          </div>
          <Link href="/admin" className="mt-4">
            <Button>Zurück zum Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Participant count and streaks from challenge data
  const streakCount = challenge.streakCount ?? 0;
  const participantCount = challenge._count?.enrollments ?? 0;
  const isActive = new Date(challenge.startAt) <= new Date() && new Date() <= new Date(challenge.endAt);
  const status = new Date(challenge.startAt) > new Date() ? "Scheduled" : isActive ? "Live" : "Completed";
  
  // Get image URL from rules or top-level imageUrl
  const rules = (challenge.rules ?? {}) as any;
  const imageUrl = rules.imageUrl || challenge.imageUrl;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header with navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Link href="/admin">
            <Button variant="outline" radius="lg" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Challenge Dashboard</h1>
            <p className="text-muted text-sm sm:text-base">Advanced analytics and marketing insights</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Badge className={`${status === "Live" ? "bg-green-500" : status === "Scheduled" ? "bg-blue-500" : "bg-gray-500"} text-center`}>
            {status}
          </Badge>
          {/* Winners button - nur für beendete Challenges */}
          {status === "Completed" && (
            <Link href={`/admin/winners/${challenge.id}`}>
              <Button variant="outline" className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200 w-full sm:w-auto">
                <Trophy className="h-4 w-4 mr-2 text-yellow-600" />
                Select Winners
              </Button>
            </Link>
          )}
          <Link href={`/admin/edit/${challenge.id}`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Settings className="h-4 w-4 mr-2" />
              Edit Challenge
            </Button>
          </Link>
        </div>
      </div>

      {/* Challenge Info Card - Enhanced */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
          {imageUrl && (
            <div className="shrink-0 self-center sm:self-auto">
              <img 
                src={imageUrl} 
                alt="Challenge" 
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border border-white/10"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">{challenge.title}</h1>
            {challenge.description && (
              <div className="text-muted mb-3 text-sm sm:text-base">{challenge.description}</div>
            )}
            <div className="text-sm text-muted mb-4">
              📅 {new Date(challenge.startAt).toLocaleDateString()} – {new Date(challenge.endAt).toLocaleDateString()}
              <span className="block sm:inline sm:ml-3 mt-1 sm:mt-0"><ChallengeCountdown endDate={challenge.endAt} /></span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🔥</span>
                <div>
                  <div className="text-base sm:text-lg font-semibold">{streakCount}</div>
                  <div className="text-xs text-muted">Total Streaks</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">👥</span>
                <div>
                  <div className="text-base sm:text-lg font-semibold">{participantCount}</div>
                  <div className="text-xs text-muted">Participants</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">📝</span>
                <div>
                  <div className="text-base sm:text-lg font-semibold">{challenge.proofType}</div>
                  <div className="text-xs text-muted">Proof Type</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">⚡</span>
                <div>
                  <div className="text-base sm:text-lg font-semibold">{challenge.cadence}</div>
                  <div className="text-xs text-muted">Cadence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Participants Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-brand" />
          <h2 className="text-xl font-semibold">Participants</h2>
        </div>
        
        {/* <ParticipantSegmentation challengeId={challenge.id} /> */}
        <AdminLeaderboardList challengeId={challenge.id} />
      </div>

      {/* Marketing & Monetization Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-brand" />
          <h2 className="text-xl font-semibold">Marketing & Monetization</h2>
        </div>
        
        <MonetizationDashboard 
          challengeId={challenge.id} 
          challengeData={{
            title: challenge.title,
            participants: participantCount
          }} 
        />
      </div>
    </div>
  );
}
