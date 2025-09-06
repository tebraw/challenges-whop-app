"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Users, Calendar, Trophy, Settings, Eye, BarChart3 } from "lucide-react";

type ChallengeDetailData = {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  proofType: string;
  cadence: string;
  policy?: string;
  status: string;
  participants: number;
  checkins: number;
  rewards?: Array<{
    place: number;
    title: string;
    description?: string;
  }>;
};

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit", 
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export default function AdminChallengeDetailPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<ChallengeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ challengeId: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (!resolvedParams?.challengeId) return;

    const fetchChallengeDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/challenges/${resolvedParams.challengeId}`);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        setChallenge(data);
      } catch (err) {
        console.error("Error fetching challenge details:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch challenge details");
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeDetails();
  }, [resolvedParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-300 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-300 rounded"></div>
              <div className="h-24 bg-gray-300 rounded"></div>
              <div className="h-24 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          
          <Card className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Fehler beim Laden
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Neu laden
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          
          <Card className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Challenge nicht gefunden
              </h2>
              <p className="text-gray-500">
                Die angeforderte Challenge existiert nicht oder wurde gelöscht.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => router.back()}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/admin/c/${challenge.id}/analytics`)}
              variant="outline"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button
              onClick={() => router.push(`/admin/c/${challenge.id}/settings`)}
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Einstellungen
            </Button>
            <Button
              onClick={() => router.push(`/c/${challenge.id}`)}
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              Vorschau
            </Button>
          </div>
        </div>

        {/* Challenge Info */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {challenge.title}
              </h1>
              {challenge.description && (
                <p className="text-gray-600 mb-4">
                  {challenge.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(challenge.startAt)} - {formatDate(challenge.endAt)}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {challenge.status}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Teilnehmer</p>
                <p className="text-xl font-semibold text-gray-900">
                  {challenge.participants}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Check-ins</p>
                <p className="text-xl font-semibold text-gray-900">
                  {challenge.checkins}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Preise</p>
                <p className="text-xl font-semibold text-gray-900">
                  {challenge.rewards?.length || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Challenge Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Challenge-Einstellungen
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Nachweis-Typ:</span>
                <span className="font-medium">{challenge.proofType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rhythmus:</span>
                <span className="font-medium">{challenge.cadence}</span>
              </div>
              {challenge.policy && (
                <div>
                  <span className="text-gray-500">Richtlinien:</span>
                  <p className="mt-1 text-sm text-gray-700">
                    {challenge.policy}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Rewards */}
          {challenge.rewards && challenge.rewards.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Belohnungen
              </h3>
              <div className="space-y-3">
                {challenge.rewards.map((reward, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full font-semibold">
                      {reward.place}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{reward.title}</p>
                      {reward.description && (
                        <p className="text-sm text-gray-500">{reward.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
