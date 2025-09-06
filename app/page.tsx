// app/page.tsx
import { prisma } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { whopSdk } from "@/lib/whop-sdk";

// Force dynamic rendering to prevent build-time database access
export const dynamic = 'force-dynamic';

export default async function Home() {
  // 🎯 SMART WHOP CONTEXT DETECTION
  try {
    const headersList = await headers();
    
    // Check if this is a Whop app context
    const whopUserToken = headersList.get('x-whop-user-token');
    const experienceId = headersList.get('x-whop-experience-id') || 
                         headersList.get('X-Whop-Experience-Id') || 
                         headersList.get('x-experience-id');
    
    if (whopUserToken) {
      console.log('🎯 Whop App Context Detected');
      
      try {
        const { userId } = await whopSdk.verifyUserToken(headersList);
        
        if (userId) {
          console.log('👤 User ID:', userId);
          
          // Method 1: Experience Context (Community Members)
          if (experienceId) {
            console.log('🎭 Experience Context - redirecting to Experience View');
            redirect(`/experiences/${experienceId}`);
          }
          
          // Method 2: Company Context (Company Owners)
          // Extract company ID from app config
          const cookieStore = await cookies();
          const appConfigCookie = cookieStore.get('whop.app-config')?.value;
          let companyId = null;
          
          if (appConfigCookie) {
            try {
              const appConfig = JSON.parse(atob(appConfigCookie.split('.')[1]));
              companyId = appConfig.did;
              console.log('🏢 Company ID from app config:', companyId);
            } catch (error) {
              console.log('❌ Failed to parse app config:', error);
            }
          }
          
          if (companyId) {
            // Check if user has company access (Dashboard View)
            const companyAccess = await whopSdk.access.checkIfUserHasAccessToCompany({
              userId,
              companyId
            });
            
            console.log('🏢 Company Access:', companyAccess);
            
            if (companyAccess.accessLevel === 'admin') {
              console.log('🎯 Company Owner - redirecting directly to Admin');
              redirect('/admin');
            } else {
              console.log('⚠️ User has company access but not admin level:', companyAccess.accessLevel);
            }
          }
        }
      } catch (whopError) {
        console.log('⚠️ Whop context detection failed:', whopError);
      }
    }
    
    // Fallback: Check local auth for backwards compatibility
    const currentUser = await getCurrentUser();
    
    // If user is ADMIN with whopCompanyId (= Company Owner), redirect to admin
    if (currentUser && currentUser.role === 'ADMIN' && currentUser.whopCompanyId) {
      redirect('/admin');
    }
  } catch (error) {
    // Continue with normal flow if auth fails
    console.log('Auth check failed on homepage:', error);
  }

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
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="mx-auto max-w-6xl px-6 py-8 pt-24 space-y-8">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 md:p-12 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
              Your Challenge Journey
            </h1>
            <p className="max-w-2xl text-white/90 mb-6 text-lg">
              Discover challenges from your favorite creators and join a community of motivated individuals working towards their goals.
            </p>
            <div className="flex gap-3">
              <Link
                href="/feed"
                className="inline-flex items-center rounded-xl bg-white text-purple-600 px-6 py-3 text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                📱 My Feed →
              </Link>
              <Link
                href="/discover"
                className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 text-white px-6 py-3 text-sm hover:bg-white/20 transition-colors"
              >
                🔍 Discover
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">0</div>
            <div className="text-gray-400">Active Challenges</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">0</div>
            <div className="text-gray-400">Completed Challenges</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
            <div className="text-gray-400">Current Streak</div>
          </div>
        </section>

        {/* Feed Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Latest Challenges
            </h2>
            <Link 
              href="/discover"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Show all →
            </Link>
          </div>
          
          {challengesForClient.length > 0 ? (
            <div className="space-y-4">
              {challengesForClient.slice(0, 3).map((challenge) => (
                <div key={challenge.id} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors">
                  <Link href={`/challenges/${challenge.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">🏆</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{challenge.title}</h3>
                          <p className="text-gray-400 text-sm mb-2">{challenge.description}</p>
                          <div className="text-xs text-gray-500">
                            {new Date(challenge.startAt).toLocaleDateString()} - {new Date(challenge.endAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                        View →
                      </button>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">No challenges yet</h3>
              <p className="text-gray-400 mb-6">
                Start your journey by discovering exciting challenges from creators around the world.
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Discover Challenges →
              </Link>
              {isAdmin && (
                <div className="mt-4">
                  <Link
                    href="/admin/new"
                    className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Or create your first challenge →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Call to Action */}
        <section className="bg-gray-800 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Your Journey?</h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Join thousands of people who are achieving their goals through structured challenges and community support.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/discover"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Browse Challenges
            </Link>
            <Link
              href="/feed"
              className="border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              View My Feed
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
