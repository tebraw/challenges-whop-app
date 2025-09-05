// app/discover/page.tsx
import { prisma } from "@/lib/prisma";
import ChallengeListClient from "../challenges/ChallengeListClient";
import { getWhopCategories } from "@/lib/whopApi";

// Force dynamic rendering to prevent build-time database access
export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  // Get all challenges
  const allChallenges = await prisma.challenge.findMany({
    orderBy: [
      { createdAt: "desc" },
      { startAt: "desc" }
    ],
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
      // TODO: Add after migration
      // whopCategoryId: true,
      // whopCategoryName: true,
      // whopTags: true,
    },
  });

  // Get Whop categories
  const whopCategories = await getWhopCategories();

  // Convert the data to match the ChallengeListClient interface
  const challengesForClient = allChallenges.map(challenge => ({
    ...challenge,
    rules: JSON.stringify(challenge.rules),
    proofType: challenge.proofType as string,
    // TODO: Add after migration
    // whopTags: challenge.whopTags ? JSON.stringify(challenge.whopTags) : null,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          Discover Challenges
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl">
          Find new challenges from various creators and expand your horizons.
        </p>
      </div>

      {/* Categories Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {whopCategories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
              style={{ 
                background: `linear-gradient(135deg, ${category.color}15, transparent)`,
                borderColor: `${category.color}30`
              }}
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {category.icon}
              </span>
              <span className="text-xs font-medium text-center leading-tight">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter/Search Section */}
      <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search for challenges..."
              className="w-full px-4 py-2 bg-transparent border border-white/20 rounded-lg focus:border-[var(--brand)] focus:outline-none"
              disabled
            />
          </div>
          <select
            className="px-4 py-2 bg-transparent border border-white/20 rounded-lg focus:border-[var(--brand)] focus:outline-none min-w-[200px]"
            disabled
          >
            <option>All Categories</option>
            {whopCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
          <select
            className="px-4 py-2 bg-transparent border border-white/20 rounded-lg focus:border-[var(--brand)] focus:outline-none min-w-[150px]"
            disabled
          >
            <option>All Status</option>
            <option>Live</option>
            <option>Planned</option>
            <option>Ended</option>
          </select>
        </div>
        <p className="text-sm text-[var(--muted)] mt-2">
          🚧 Filters and search coming soon! Categories will be automatically synchronized from Whop.
        </p>
      </div>

      {/* Challenges Grid */}
      {challengesForClient.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              All Challenges ({challengesForClient.length})
            </h2>
          </div>
          <ChallengeListClient rows={challengesForClient} />
        </div>
      ) : (
        <div className="card p-8 text-center text-[var(--muted)]">
          <p>No challenges found.</p>
        </div>
      )}
    </main>
  );
}
