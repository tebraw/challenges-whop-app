// app/dashboard/page.tsx
import { getWhopUserFromHeaders } from "@/lib/whop-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { CalendarDays, Trophy, Users, Plus, BarChart3 } from "lucide-react";

// Force dynamic rendering to prevent build-time database access
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Get Whop user from headers
  const whopUser = await getWhopUserFromHeaders();
  
  if (!whopUser?.userId) {
    redirect('/auth/whop');
  }

  // Get user's challenges (created by them)
  const userChallenges = await prisma.challenge.findMany({
    where: {
      whopCreatorId: whopUser.userId,
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      _count: {
        select: {
          enrollments: true
        }
      }
    }
  });

  // Get user's enrollments (challenges they're participating in)
  const userEnrollments = await prisma.enrollment.findMany({
    where: {
      userId: whopUser.userId,
    },
    include: {
      challenge: {
        select: {
          id: true,
          title: true,
          description: true,
          startAt: true,
          endAt: true,
          imageUrl: true,
          proofType: true,
        }
      },
      _count: {
        select: {
          proofs: true
        }
      }
    },
    orderBy: {
      joinedAt: 'desc'
    }
  });

  // Calculate statistics
  const stats = {
    challengesCreated: userChallenges.length,
    challengesParticipating: userEnrollments.length,
    totalParticipants: userChallenges.reduce((sum: number, challenge: any) => sum + challenge._count.enrollments, 0),
    totalSubmissions: userEnrollments.reduce((sum: number, enrollment: any) => sum + enrollment._count.proofs, 0),
  };

  // Get active challenges (currently running)
  const activeChallenges = userChallenges.filter((challenge: any) => {
    const now = new Date();
    const start = new Date(challenge.startAt);
    const end = new Date(challenge.endAt);
    return now >= start && now <= end;
  });

  const activeEnrollments = userEnrollments.filter((enrollment: any) => {
    const now = new Date();
    const start = new Date(enrollment.challenge.startAt);
    const end = new Date(enrollment.challenge.endAt);
    return now >= start && now <= end;
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your challenge overview.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0">
            <h3 className="text-sm font-medium">Challenges Created</h3>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.challengesCreated}</div>
        </Card>
        
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0">
            <h3 className="text-sm font-medium">Participating In</h3>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.challengesParticipating}</div>
        </Card>
        
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0">
            <h3 className="text-sm font-medium">Total Participants</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.totalParticipants}</div>
        </Card>
        
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0">
            <h3 className="text-sm font-medium">Total Submissions</h3>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.totalSubmissions}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Challenges */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Challenges</h2>
            <Link href="/c/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {activeChallenges.length > 0 ? (
              activeChallenges.map((challenge: any) => (
                <Card key={challenge.id} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{challenge.title}</h3>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">{challenge.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {challenge._count.enrollments} participants
                    </div>
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      {challenge._count.proofs} submissions
                    </div>
                  </div>
                  <Link href={`/c/${challenge.id}`}>
                    <Button variant="outline">
                      View Challenge
                    </Button>
                  </Link>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active challenges</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first challenge to get started!
                </p>
                <Link href="/c/create">
                  <Button>
                    Create Challenge
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </div>

        {/* My Participations */}
        <div>
          <h2 className="text-2xl font-bold mb-4">My Participations</h2>
          
          <div className="space-y-4">
            {activeEnrollments.length > 0 ? (
              activeEnrollments.map((enrollment: any) => (
                <Card key={enrollment.id} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{enrollment.challenge.title}</h3>
                    <Badge variant="muted">Participating</Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">{enrollment.challenge.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      Ends {new Date(enrollment.challenge.endAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      {(enrollment as any).challenge._count?.proofs || 0} submissions
                    </div>
                  </div>
                  <Link href={`/c/${enrollment.challenge.id}`}>
                    <Button variant="outline">
                      View Challenge
                    </Button>
                  </Link>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active participations</h3>
                <p className="text-muted-foreground mb-4">
                  Join challenges to start competing!
                </p>
                <Link href="/discover">
                  <Button>
                    Browse Challenges
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/c/create">
            <Button variant="outline" className="h-20 w-full flex flex-col items-center">
              <Plus className="h-6 w-6 mb-2" />
              Create New Challenge
            </Button>
          </Link>
          <Link href="/discover">
            <Button variant="outline" className="h-20 w-full flex flex-col items-center">
              <Trophy className="h-6 w-6 mb-2" />
              Browse Challenges
            </Button>
          </Link>
          <Link href="/feed">
            <Button variant="outline" className="h-20 w-full flex flex-col items-center">
              <BarChart3 className="h-6 w-6 mb-2" />
              View Activity Feed
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
