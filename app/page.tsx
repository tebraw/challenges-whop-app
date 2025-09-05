// app/page.tsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";
import ChallengeListClient from "./challenges/ChallengeListClient";

export default async function Home() {
  // For now, show recent challenges as feed (later: filter by followed creators from Whop API)
  const recentChallenges = await prisma.challenge.findMany({
    take: 5,
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

  // Convert the data to match the ChallengeListClient interface
  const challengesForClient = recentChallenges.map(challenge => ({
    ...challenge,
    rules: JSON.stringify(challenge.rules),
    proofType: challenge.proofType as string,
  }));

  // Determine if current user is an admin (dev cookie `as` holds userId)
  let isAdmin = false;
  try {
    const userId = (await cookies()).get("as")?.value;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      isAdmin = user?.role === "ADMIN";
    }
  } catch {
    // default: not admin
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
      {/* Hero Section */}
      <section className="gradient-hero rounded-2xl p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Your Challenge Feed
        </h1>
        <p className="max-w-2xl text-[var(--muted)] mb-6">
          Discover challenges from your favorite creators and find new exciting challenges.
        </p>
        <div className="flex gap-3">
          <Link
            href="/feed"
            className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-black hover:bg-brand/90"
          >
            My Feed →
          </Link>
          <Link
            href="/discover"
            className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm hover:bg-white/10"
          >
            Discover
          </Link>
        </div>
      </section>

      {/* Feed Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">
            Latest Challenges
          </h2>
          <Link 
            href="/challenges"
            className="text-[var(--brand)] hover:text-[var(--brand)]/80 font-medium"
          >
            Show all →
          </Link>
        </div>
        
        {challengesForClient.length > 0 ? (
          <ChallengeListClient rows={challengesForClient} />
        ) : (
          <div className="card p-8 text-center text-[var(--muted)]">
            <p>No challenges available yet.</p>
            {isAdmin && (
              <Link
                href="/admin/new"
                className="inline-flex items-center mt-4 text-[var(--brand)] hover:text-[var(--brand)]/80"
              >
                Create first challenge →
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
