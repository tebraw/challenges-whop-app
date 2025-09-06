// app/feed/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getUserAccessLevel, type AccessControlResult } from "@/lib/access-control";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Calendar, Users, Award } from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  imageUrl?: string;
  _count?: { enrollments: number };
  creator?: { name: string; };
  rules?: any;
};

export default function FeedPage() {
  const [userAccess, setUserAccess] = useState<AccessControlResult | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Check user access
        const access = await getUserAccessLevel();
        setUserAccess(access);

        // If user can't view feed, don't load challenges
        if (!access.canViewMyFeed) {
          setLoading(false);
          return;
        }

        // Load challenges for user's feed
        const response = await fetch('/api/challenges');
        if (response.ok) {
          const data = await response.json();
          setChallenges(data.challenges || []);
        }
      } catch (error) {
        console.error('Error loading feed:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-panel rounded w-1/3"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-48 bg-panel"></Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has access to this page
  if (!userAccess?.canViewMyFeed) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <Card className="py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Restricted</h1>
            <p className="text-muted mb-6">
              You need to be logged in as a customer or company owner to view your feed.
            </p>
            <Link 
              href="/auth/whop" 
              className="inline-block bg-brand text-brand-foreground px-6 py-3 rounded-lg hover:bg-brand/90 transition-colors"
            >
              Sign In
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Feed</h1>
          <p className="text-muted">
            {userAccess.userType === 'customer' 
              ? 'Challenges from creators you follow and participate in'
              : 'Your challenges and community activity'
            }
          </p>
        </div>

        {challenges.length === 0 ? (
          <Card className="text-center py-12">
            <h2 className="text-xl font-semibold text-foreground mb-4">No challenges yet</h2>
            <p className="text-muted mb-6">
              {userAccess.userType === 'customer' 
                ? 'Start following creators and join challenges to see them here.'
                : 'Create your first challenge to get started!'
              }
            </p>
            <Link 
              href={userAccess.userType === 'customer' ? '/discover' : '/admin/new'}
              className="inline-block bg-brand text-brand-foreground px-6 py-3 rounded-lg hover:bg-brand/90 transition-colors"
            >
              {userAccess.userType === 'customer' ? 'Discover Challenges' : 'Create Challenge'}
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                <Link href={`/c/${challenge.id}`} className="block">
                  <div className="flex gap-4">
                    {challenge.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={challenge.imageUrl}
                          alt={challenge.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-2 truncate">
                        {challenge.title}
                      </h3>
                      {challenge.description && (
                        <p className="text-muted text-sm mb-3 line-clamp-2">
                          {challenge.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(challenge.startAt).toLocaleDateString()} - {new Date(challenge.endAt).toLocaleDateString()}
                          </span>
                        </div>
                        {challenge._count?.enrollments && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{challenge._count.enrollments} participants</span>
                          </div>
                        )}
                        {challenge.rules?.rewards?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            <span>{challenge.rules.rewards.length} rewards</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
