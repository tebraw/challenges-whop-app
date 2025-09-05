"use client";
import React from "react";

export default function JoinSection({
  challengeId,
  isEnrolled,
}: { challengeId: string; isEnrolled: boolean }) {
  const [joined, setJoined] = React.useState(isEnrolled);
  const [busy, setBusy] = React.useState(false);

  async function join() {
    try {
      setBusy(true);
      const res = await fetch(`/api/c/${challengeId}/join`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) throw new Error(data?.message || `Error ${res.status}`);
  setJoined(true);
  window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Could not join.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={joined ? "card p-4" : ""}>
      {joined ? (
        <div className="flex items-center gap-3 text-sm">
          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-green-400 text-lg">✓</span>
          </div>
          <div>
            <div className="font-medium text-green-400">You're participating!</div>
            <div className="text-[var(--muted)] text-xs">Good luck with your challenge 🎉</div>
          </div>
        </div>
      ) : (
        <button
          onClick={join}
          disabled={busy}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-white font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          title="Join challenge"
        >
          <div className="relative z-10 flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            {busy ? "Joining…" : "Join Challenge"}
          </div>
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        </button>
      )}
    </div>
  );
}
