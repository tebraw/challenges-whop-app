'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { ArrowLeft, Edit, Users, Calendar, Trophy } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  whopCategoryName: string;
  startAt: string;
  endAt: string;
  proofType: string;
  cadence: string;
  rules: any;
  _count?: {
    enrollments: number;
  };
  createdAt: string;
}

export default function ChallengeViewPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChallenge() {
      try {
        console.log('Fetching challenge:', challengeId);
        const response = await fetch(`/api/admin/challenges/${challengeId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch challenge: ${response.status}`);
        }
        
        const data = await response.json();
        setChallenge(data.challenge);
      } catch (err) {
        console.error('Failed to fetch challenge:', err);
        setError(err instanceof Error ? err.message : 'Failed to load challenge');
      } finally {
        setLoading(false);
      }
    }

    if (challengeId) {
      fetchChallenge();
    }
  }, [challengeId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Challenge</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/admin">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Challenge Not Found</h1>
          <p className="text-gray-600 mb-4">The challenge you're looking for doesn't exist.</p>
          <Link href="/admin">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(challenge.startAt);
  const endDate = new Date(challenge.endAt);
  const now = new Date();
  
  const status = now < startDate ? 'upcoming' : now > endDate ? 'ended' : 'active';
  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    ended: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Challenge Details</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={statusColors[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          <Link href={`/admin/edit/${challengeId}`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Challenge Image */}
      {challenge.imageUrl && (
        <div className="mb-6">
          <img
            src={challenge.imageUrl}
            alt={challenge.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Challenge Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{challenge.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{challenge.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Category</h4>
                  <p className="font-medium">{challenge.whopCategoryName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Proof Type</h4>
                  <p className="font-medium">{challenge.proofType}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Cadence</h4>
                  <p className="font-medium">{challenge.cadence}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Created</h4>
                  <p className="font-medium">{new Date(challenge.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Rules */}
              {challenge.rules && (
                <div className="mt-6">
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">Rules & Rewards</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(challenge.rules, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {challenge._count?.enrollments || 0}
              </div>
              <p className="text-sm text-gray-500">Total enrolled</p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-gray-500">Start Date</h4>
                <p className="font-medium">{startDate.toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">{startDate.toLocaleTimeString()}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-500">End Date</h4>
                <p className="font-medium">{endDate.toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">{endDate.toLocaleTimeString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/admin/winners/${challengeId}`} className="block">
                <Button variant="outline" className="w-full">
                  View Winners
                </Button>
              </Link>
              <Link href={`/admin/analytics/${challengeId}`} className="block">
                <Button variant="outline" className="w-full">
                  Analytics
                </Button>
              </Link>
              <Link href={`/admin/participants/${challengeId}`} className="block">
                <Button variant="outline" className="w-full">
                  Participants
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
