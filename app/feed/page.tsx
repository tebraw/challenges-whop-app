import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import Button from "@/components/ui/Button";

type Challenge = {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  imageUrl?: string;
  _count?: { enrollments: number };
};

export default async function FeedPage() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Required</h1>
            <p className="text-gray-400">Please access this app through Whop.</p>
          </div>
        </div>
      );
    }

    const experienceId = user.whopCompanyId;
    const challenges: Challenge[] = [];

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Challenge Feed</h1>
              <p className="text-gray-400 mt-1">Welcome back! Here are your challenges.</p>
            </div>
          </div>

          {challenges.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
                <h2 className="text-xl font-semibold mb-4">No challenges yet</h2>
                <p className="text-gray-400 mb-6">Check back later for new challenges.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <Link href={experienceId ? `/experiences/${experienceId}/c/${challenge.id}` : `/c/${challenge.id}`}>
                          <h3 className="text-lg font-semibold text-foreground hover:text-brand transition-colors truncate">
                            {challenge.title}
                          </h3>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error loading feed:', error);
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-8">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
}
