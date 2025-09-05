// app/admin-direct/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function AdminDirectPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const response = await fetch('/api/challenges');
      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted mt-2">Manage your challenges</p>
          </div>
          <Link href="/admin/new">
            <Button>Create New Challenge</Button>
          </Link>
        </div>

        {loading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading challenges...</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            <h2 className="text-xl font-semibold">Challenges ({challenges.length})</h2>
            {challenges.length === 0 ? (
              <Card className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No challenges yet</h3>
                <p className="text-muted mb-4">Create your first challenge to get started!</p>
                <Link href="/admin/new">
                  <Button>Create First Challenge</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid gap-4">
                {challenges.map((challenge) => (
                  <Card key={challenge.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{challenge.title}</h3>
                        {challenge.description && (
                          <p className="text-muted mt-1">{challenge.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-muted">
                          <span>Start: {new Date(challenge.startAt).toLocaleDateString()}</span>
                          <span>End: {new Date(challenge.endAt).toLocaleDateString()}</span>
                          <span>Type: {challenge.proofType}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/admin/edit/${challenge.id}`}>
                          <Button variant="outline" className="text-sm">Edit</Button>
                        </Link>
                        <Link href={`/c/${challenge.id}`}>
                          <Button variant="outline" className="text-sm">View</Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
