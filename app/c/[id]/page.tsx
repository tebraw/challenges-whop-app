// app/c/[id]/page.tsx  — Participant View
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import JoinSection from "@/components/user/JoinSection";
import ProofForm from "@/components/user/ProofForm";
import StreakBar from "@/components/user/StreakBar";
import LeaderboardList from "@/components/user/LeaderboardList";
import UserMonetization from "@/components/user/UserMonetization";
import ChallengeAccessGate from "@/components/ChallengeAccessGate";
import { calculateChallengeProgress, isChallengeActive, isChallengeEnded } from "@/lib/challengeRules";

export default async function ChallengePublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // First check if challenge exists at all
  const challengeExists = await prisma.challenge.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!challengeExists) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold">Challenge nicht gefunden</h1>
      </main>
    );
  }

  // Wrap the actual challenge content in the access gate
  return (
    <ChallengeAccessGate challengeId={id}>
      <ChallengeContent challengeId={id} />
    </ChallengeAccessGate>
  );
}

async function ChallengeContent({ challengeId }: { challengeId: string }) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      enrollments: { include: { checkins: true, proofs: true } },
    },
  });

  if (!challenge) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold">Challenge nicht gefunden</h1>
      </main>
    );
  }

  // Extrahiere die echte Cadence aus den rules (falls dort gespeichert)
  const rules = challenge.rules as any;
  const actualCadence = rules?.cadence === "END" ? "END_OF_CHALLENGE" : 
                       rules?.cadence === "END_OF_CHALLENGE" ? "END_OF_CHALLENGE" :
                       challenge.cadence === "END_OF_CHALLENGE" ? "END_OF_CHALLENGE" : "DAILY";

  // Extract image URL from rules or top-level imageUrl
  const imageUrl = rules?.imageUrl || challenge.imageUrl;

  // Get authenticated user from cookie (Whop integration required)
  const userId = (await cookies()).get("as")?.value;
  
  if (!userId) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-[var(--muted)] mb-6">
            You need to be authenticated through Whop to access this challenge.
          </p>
          <button className="btn btn-primary">
            Sign in with Whop
          </button>
        </div>
      </main>
    );
  }

  const myEnrollment = challenge.enrollments?.find((e) => e.userId === userId);

  // Prüfe, ob heute bereits ein Proof existiert (für DAILY) oder überhaupt ein Proof (für END_OF_CHALLENGE)
  const existingProofToday = myEnrollment ? (() => {
    if (actualCadence === "END_OF_CHALLENGE") {
      // Für END_OF_CHALLENGE: Prüfe ob überhaupt ein aktiver Proof existiert
      return myEnrollment.proofs.some(p => p.isActive);
    } else if (actualCadence === "DAILY") {
      // Für DAILY: Prüfe ob heute bereits ein aktiver Proof existiert
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));
      
      return myEnrollment.proofs
        .filter(p => p.isActive)
        .some(proof => {
          const proofDate = new Date(proof.createdAt);
          return proofDate >= todayStart && proofDate <= todayEnd;
        });
    }
    return false;
  })() : false;

  // Calculate challenge progress with new rules and corrected cadence
  const challengeForCalculation = { ...challenge, cadence: actualCadence as any };
  const progress = calculateChallengeProgress(
    challengeForCalculation,
    myEnrollment?.checkins ?? [],
    myEnrollment?.proofs ?? []
  );

  // Determine challenge status with corrected cadence
  const isActive = isChallengeActive(challengeForCalculation);
  const isEnded = isChallengeEnded(challengeForCalculation);
  
  // Status-Nachricht für den Benutzer
  let statusMessage = "";
  if (!isActive && !isEnded) {
    statusMessage = "Challenge starts on " + new Date(challenge.startAt).toLocaleDateString();
  } else if (isEnded) {
    statusMessage = actualCadence === "END_OF_CHALLENGE" 
      ? "Challenge ended - submission still possible"
      : "Challenge ended";
  } else {
    statusMessage = actualCadence === "END_OF_CHALLENGE"
      ? `Challenge runs until ${new Date(challenge.endAt).toLocaleDateString()}`
      : "Challenge is running";
  }

  if (!myEnrollment) {
    // Preview mode for non-enrolled users
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 mb-8">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {imageUrl && (
              <div className="shrink-0">
                <img
                  src={imageUrl}
                  alt={challenge.title}
                  className="h-32 w-32 rounded-2xl object-cover border-2 border-white/20 shadow-2xl"
                />
              </div>
            )}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                {challenge.title}
              </h1>
              {challenge.description && (
                <p className="text-lg text-white/80 mb-6 leading-relaxed">
                  {challenge.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{new Date(challenge.startAt).toLocaleDateString()} – {new Date(challenge.endAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⏱️</span>
                  <span>{actualCadence === "END_OF_CHALLENGE" ? "Submit once" : "Daily commitment"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-400/10 to-blue-400/10 rounded-full blur-2xl"></div>
        </div>

        {/* Rewards Section */}
        {rules?.rewards && rules.rewards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">🏆 Rewards & Prizes</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rules.rewards.map((reward: any, index: number) => (
                <div key={index} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-600/20 to-orange-600/20 p-6 border border-yellow-500/30">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-full bg-yellow-500/30 flex items-center justify-center">
                        <span className="text-yellow-400 font-bold">#{reward.place}</span>
                      </div>
                      <h3 className="font-semibold text-lg">{reward.title}</h3>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{reward.desc}</p>
                  </div>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-2xl"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status and Join Section */}
        <div className="flex flex-col md:flex-row gap-6 items-center mb-8">
          <div className="flex-1">
            <div className="bg-[var(--muted-bg)] p-4 rounded-xl border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <div className="font-medium">{statusMessage}</div>
                  <div className="text-sm text-[var(--muted)]">
                    {progress.totalDays} day{progress.totalDays !== 1 ? 's' : ''} • 
                    {challenge.enrollments?.length || 0} participant{(challenge.enrollments?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <JoinSection challengeId={challenge.id} isEnrolled={false} />
          </div>
        </div>

        {/* Features & Benefits */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold">Challenge Yourself</h3>
            </div>
            <p className="text-[var(--muted)] leading-relaxed">
              Join a community of motivated individuals working towards their goals. 
              Track your progress and stay accountable with daily check-ins.
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 text-xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold">Earn Recognition</h3>
            </div>
            <p className="text-[var(--muted)] leading-relaxed">
              Complete the challenge to earn your spot on the leaderboard and gain 
              recognition for your dedication and consistency.
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold">Community Support</h3>
            </div>
            <p className="text-[var(--muted)] leading-relaxed">
              Connect with like-minded people who share similar goals. 
              See how others are progressing and get inspired by their journey.
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-400 text-xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold">Track Progress</h3>
            </div>
            <p className="text-[var(--muted)] leading-relaxed">
              Visual progress tracking helps you stay motivated. See your streak grow 
              and celebrate every milestone along the way.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Enrolled user view
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 p-8 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {imageUrl && (
            <div className="shrink-0">
              <img
                src={imageUrl}
                alt={challenge.title}
                className="h-24 w-24 md:h-32 md:w-32 rounded-2xl object-cover border-2 border-white/20 shadow-2xl"
              />
            </div>
          )}
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                ✅ You're participating!
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {challenge.title}
            </h1>
            {challenge.description && (
              <p className="text-lg text-white/80 mb-4 leading-relaxed">
                {challenge.description}
              </p>
            )}
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-white/70">
              <span className="flex items-center gap-2">
                📅 {new Date(challenge.startAt).toLocaleDateString()} – {new Date(challenge.endAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                👥 {challenge.enrollments?.length || 0} participants
              </span>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-lg"></div>
      </div>

      {/* Status Card */}
      <div className="mb-8">
        <div className="card p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              {isActive ? '🚀' : isEnded ? '🏁' : '⏰'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Challenge Status</h3>
              <p className="text-[var(--muted)]">{statusMessage}</p>
              {progress.progressPercentage > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-medium">{progress.progressPercentage}% completed</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <section className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Streak Progress Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-400 text-xl">🔥</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Your Progress</h3>
                <p className="text-sm text-[var(--muted)]">Keep your streak alive!</p>
              </div>
            </div>
            <StreakBar
              totalDays={progress.totalDays}
              doneDays={progress.completedDays}
              photoDays={
                actualCadence === "END_OF_CHALLENGE"
                  ? progress.completedDays > 0 && myEnrollment?.checkins?.[0]?.imageUrl ? [1] : []
                  : myEnrollment?.checkins
                      ?.filter((c) => c.imageUrl)
                      ?.map((c) => {
                        const created = new Date(c.createdAt);
                        const start = new Date(challenge.startAt);
                        return Math.floor((created.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      }) ?? []
              }
            />
          </div>

          {/* Proof Submission Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-xl">📸</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Submit Your Proof</h3>
                <p className="text-sm text-[var(--muted)]">
                  {actualCadence === "DAILY" ? "Upload your daily progress" : "Share your final result"}
                </p>
              </div>
            </div>
            <ProofForm 
              challengeId={challenge.id} 
              enrolled={true}
              challenge={{
                cadence: actualCadence,
                existingProofToday,
                proofType: challenge.proofType
              }}
            />
          </div>

          {/* Challenge Details Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 text-xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold">Challenge Details</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-[var(--muted-bg)]">
                <div className="text-2xl font-bold text-blue-500">{progress.totalDays}</div>
                <div className="text-xs text-[var(--muted)]">Total Days</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--muted-bg)]">
                <div className="text-2xl font-bold text-green-500">{progress.completedDays}</div>
                <div className="text-xs text-[var(--muted)]">Completed</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--muted-bg)]">
                <div className="text-2xl font-bold text-orange-500">{progress.totalDays - progress.completedDays}</div>
                <div className="text-xs text-[var(--muted)]">Remaining</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--muted-bg)]">
                <div className="text-2xl font-bold text-purple-500">{challenge.enrollments?.length || 0}</div>
                <div className="text-xs text-[var(--muted)]">Participants</div>
              </div>
            </div>
          </div>

          {/* Challenge Terms & Policy Card */}
          {rules?.policy && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 text-xl">📜</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Challenge Terms & Rules</h3>
                  <p className="text-sm text-[var(--muted)]">Important information for participants</p>
                </div>
              </div>
              <div className="bg-[var(--muted-bg)] rounded-lg p-4 border border-emerald-500/20">
                <div className="prose prose-sm max-w-none text-[var(--text)]">
                  {rules.policy.split('\n\n').map((paragraph: string, index: number) => {
                    // Handle numbered lists
                    if (paragraph.match(/^\d+\./)) {
                      const lines = paragraph.split('\n').filter(line => line.trim());
                      return (
                        <div key={index} className="mb-4">
                          <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed">
                            {lines.map((line, lineIndex) => (
                              <li key={lineIndex} className="text-[var(--muted)]">
                                {line.replace(/^\d+\.\s*/, '')}
                              </li>
                            ))}
                          </ol>
                        </div>
                      );
                    }
                    // Handle regular paragraphs
                    return (
                      <p key={index} className="mb-3 text-sm leading-relaxed text-[var(--muted)]">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-500/20">
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <span>✅</span>
                    <span>By participating, you agree to these terms and conditions</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monetization Offers */}
          {myEnrollment && (
            <UserMonetization 
              challengeId={challenge.id}
              userId={userId}
              userProgress={{
                completionRate: Math.round(progress.progressPercentage),
                isCompleted: progress.progressPercentage >= 100,
                streakCount: myEnrollment.checkins.length, // Simplified streak calculation
                isHighEngagement: myEnrollment.checkins.length >= Math.floor(progress.totalDays * 0.7),
                daysSinceStart: Math.ceil((Date.now() - new Date(challenge.startAt).getTime()) / (1000 * 60 * 60 * 24))
              }}
              monetizationRules={
                (rules as any)?.monetizationRules || { enabled: false }
              }
            />
          )}
        </div>

        {/* Right Column - Sidebar */}
        <aside className="space-y-6">
          {/* Leaderboard Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="text-yellow-400 text-xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold">Leaderboard</h3>
            </div>
            <LeaderboardList challengeId={challenge.id} />
          </div>

          {/* Quick Actions Card */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <JoinSection challengeId={challenge.id} isEnrolled={true} />
              <button className="w-full btn btn-outline text-sm py-2">
                💬 Join Community Chat
              </button>
              <button className="w-full btn btn-outline text-sm py-2">
                📊 View My Stats
              </button>
            </div>
          </div>

          {/* Motivation Card */}
          <div className="card p-6 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
            <div className="text-center">
              <div className="text-4xl mb-3">💪</div>
              <h3 className="font-semibold mb-2">Stay Strong!</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Every day you complete brings you closer to your goal. You've got this!
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
