// app/challenges/page.tsx
import { prisma } from "@/lib/prisma";
import ChallengeListClient from "./ChallengeListClient";

export default async function PublicChallengesPage() {
  const rows = await prisma.challenge.findMany({
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
  const challengesForClient = rows.map(challenge => ({
    ...challenge,
    rules: JSON.stringify(challenge.rules), // Convert JsonValue to string
    proofType: challenge.proofType as string,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2">🏆 Challenges</h1>
        <p className="text-sm sm:text-base text-[var(--muted)]">
          Discover and join exciting challenges from the community
        </p>
      </div>
      <ChallengeListClient rows={challengesForClient} />
    </main>
  );
}
