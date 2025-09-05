// app/experience/[id]/page.tsx
import { getWhopUserFromHeaders } from "@/lib/whop-auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { CalendarDays, Trophy, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import ChallengeCountdown from "@/components/ui/ChallengeCountdown";

// Force dynamic rendering to prevent build-time database access
export const dynamic = 'force-dynamic';

type ExperiencePageProps = {
  params: Promise<{
    id: string;
  }>;
};

// Add types for better TypeScript support
type UserProof = {
  id: string;
  content: string;
  submittedAt: Date;
  whopUserId: string;
};

type RecentProof = {
  id: string;
  content: string;
  submittedAt: Date;
  whopUserId: string;
};

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { id } = await params;
  
  // Get Whop user from headers
  const whopUser = await getWhopUserFromHeaders();
  
  if (!whopUser?.userId) {
    redirect('/auth/whop');
  }

  // Get the challenge details
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          enrollments: true
        }
      }
    }
  });

  if (!challenge) {
    notFound();
  }

  // Check if user is enrolled in this challenge
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      challengeId: id,
      userId: whopUser.userId
    }
  });

  // Get user's proofs for this challenge
  const userProofs = await prisma.proof.findMany({
    where: {
      enrollment: {
        challengeId: id,
        userId: whopUser.userId
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get recent proofs from other participants (for community aspect)
  const recentProofs = await prisma.proof.findMany({
    where: {
      enrollment: {
        challengeId: id,
        userId: { not: whopUser.userId }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5,
    include: {
      enrollment: {
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  // Get total proofs count for this challenge
  const totalProofsCount = await prisma.proof.count({
    where: {
      enrollment: {
        challengeId: id
      }
    }
  });

  // Calculate challenge status
  const now = new Date();
  const startDate = new Date(challenge.startAt);
  const endDate = new Date(challenge.endAt);
  
  let status: 'upcoming' | 'active' | 'ended' = 'upcoming';
  if (now >= startDate && now <= endDate) {
    status = 'active';
  } else if (now > endDate) {
    status = 'ended';
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="warning">Upcoming</Badge>;
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'ended':
        return <Badge variant="muted">Ended</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const rules = typeof challenge.rules === 'string' 
    ? JSON.parse(challenge.rules) 
    : challenge.rules || {};

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/discover">
            <Button variant="ghost">← Back to Discover</Button>
          </Link>
          {getStatusBadge()}
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          {challenge.title}
        </h1>
        
        {challenge.description && (
          <p className="text-lg text-muted-foreground mb-6">
            {challenge.description}
          </p>
        )}
      </div>

      {/* Challenge Image */}
      {challenge.imageUrl && (
        <div className="mb-8">
          <img 
            src={challenge.imageUrl} 
            alt={challenge.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Challenge Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{challenge._count.enrollments}</p>
              <p className="text-sm text-muted-foreground">Participants</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{totalProofsCount}</p>
              <p className="text-sm text-muted-foreground">Submissions</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{userProofs.length}</p>
              <p className="text-sm text-muted-foreground">Your Submissions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Challenge Countdown */}
      {status === 'active' && (
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Time Remaining</h3>
          <ChallengeCountdown endDate={challenge.endAt} />
        </Card>
      )}

      {/* Challenge Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Challenge Details</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">
                <strong>Start:</strong> {formatDate(startDate)}
              </span>
            </div>
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">
                <strong>End:</strong> {formatDate(endDate)}
              </span>
            </div>
            <div className="flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">
                <strong>Proof Type:</strong> {challenge.proofType}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Challenge Rules</h3>
          <div className="space-y-2">
            {rules.description && (
              <p className="text-sm text-muted-foreground">{rules.description}</p>
            )}
            {rules.requirements && Array.isArray(rules.requirements) && rules.requirements.length > 0 && (
              <ul className="text-sm space-y-1">
                {rules.requirements.map((req: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Participation Section */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Your Participation</h3>
        
        {!enrollment ? (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold mb-2">Not Enrolled</h4>
            <p className="text-muted-foreground mb-4">
              You haven't joined this challenge yet.
            </p>
            {status === 'active' && (
              <Link href={`/c/${challenge.id}`}>
                <Button>
                  Join Challenge
                </Button>
              </Link>
            )}
            {status === 'upcoming' && (
              <p className="text-sm text-muted-foreground">
                Challenge hasn't started yet. Check back on {formatDate(startDate)}.
              </p>
            )}
            {status === 'ended' && (
              <p className="text-sm text-muted-foreground">
                This challenge has ended.
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-4">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="font-medium">Enrolled since {formatDate(new Date(enrollment.joinedAt))}</span>
            </div>
            
            {userProofs.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Your Submissions ({userProofs.length})</h4>
                <div className="space-y-3">
                  {userProofs.map((proof) => (
                    <div key={proof.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Submitted {formatDate(new Date(proof.createdAt))}
                        </span>
                        <Badge variant="success">Submitted</Badge>
                      </div>
                      <p className="text-sm">{proof.text || proof.url || 'No content'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {status === 'active' && (
              <div className="mt-6">
                <Link href={`/c/${challenge.id}`}>
                  <Button>
                    {userProofs.length > 0 ? 'Submit Another Proof' : 'Submit Your First Proof'}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      {recentProofs.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Community Activity</h3>
          <div className="space-y-3">
            {recentProofs.map((proof) => (
              <div key={proof.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{proof.enrollment.user.name || 'Anonymous'}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(new Date(proof.createdAt))}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{proof.text || proof.url || 'Submitted proof'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}
