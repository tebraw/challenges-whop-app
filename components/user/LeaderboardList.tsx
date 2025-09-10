"use client";
import React from "react";

type Row = { userId: string; count: number };

export default function LeaderboardList({ challengeId }: { challengeId: string }) {
  // ❌ LEADERBOARD HIDDEN FROM PARTICIPANTS
  // Per security policy: Participants should not see rankings
  return (
    <div className="card p-4">
      <div className="font-semibold mb-3">Challenge Progress</div>
      <div className="text-sm text-[var(--muted)]">
        Keep going! Focus on your own journey and check-ins.
      </div>
      <div className="mt-3 text-xs text-[var(--muted)]">
        Rankings are only visible to challenge administrators.
      </div>
    </div>
  );
}
