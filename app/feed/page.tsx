// app/feed/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ChallengeListClient from "../challenges/ChallengeListClient";
import { getChallengesFromFollowedCreators } from "@/lib/whopApi";

export default async function FeedPage() {
  // TODO: Get the current user's Whop ID from session/auth
  const currentUserWhopId = "mock_user_id"; // This should come from authentication
  
  let feedChallenges;
  
  try {
    // Get creators that the user follows on Whop
    const followedCreatorIds = await getChallengesFromFollowedCreators(currentUserWhopId);
    
    // Get challenges from those creators
    feedChallenges = await prisma.challenge.findMany({
      where: {
        // TODO: Once migration is done, filter by whopCreatorId
        // whopCreatorId: {
        //   in: followedCreatorIds
        // }
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        proofType: true,
        rules: true,
        createdAt: true,
        imageUrl: true,
      },
    });
  } catch (error) {
    console.error("Error fetching feed challenges:", error);
    // Fallback to recent challenges
    feedChallenges = await prisma.challenge.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        proofType: true,
        rules: true,
        createdAt: true,
        imageUrl: true,
      },
    });
  }

  // Convert the data to match the ChallengeListClient interface
  const challengesForClient = feedChallenges.map(challenge => ({
    ...challenge,
    rules: JSON.stringify(challenge.rules),
    proofType: challenge.proofType as string,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          Your Personal Feed
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl">
          Challenges from the creators you follow on Whop.
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-lg">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-400 mb-1">Whop Integration</h3>
            <p className="text-sm text-blue-300">
              Your feed will be personalized based on the creators you follow on Whop. 
              The integration will be activated soon.
            </p>
          </div>
        </div>
      </div>

      {/* Feed Challenges */}
      {challengesForClient.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              From your creators ({challengesForClient.length})
            </h2>
            <Link 
              href="/discover"
              className="text-[var(--brand)] hover:text-[var(--brand)]/80 font-medium"
            >
              Discover more →
            </Link>
          </div>
          <ChallengeListClient rows={challengesForClient} />
        </div>
      ) : (
        <div className="card p-8 text-center text-[var(--muted)]">
          <h3 className="font-semibold mb-2">No feed challenges found</h3>
          <p className="mb-4">
            Either the creators you follow haven't created challenges yet, 
            or the Whop integration is not yet active.
          </p>
          <Link 
            href="/discover" 
            className="inline-flex items-center text-[var(--brand)] hover:text-[var(--brand)]/80"
          >
            Discover new Challenges →
          </Link>
        </div>
      )}
    </main>
  );
}
