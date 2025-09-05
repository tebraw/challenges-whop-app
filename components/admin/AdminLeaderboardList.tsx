"use client";
import React from "react";
import Link from "next/link";
import { User, Calendar } from "lucide-react";

type LeaderboardRow = { 
  userId: string; 
  userEmail: string;
  userName: string;
  userCreatedAt: string | null;
  count: number;
  enrollmentId: string;
};

export default function AdminLeaderboardList({ challengeId }: { challengeId: string }) {
  const [rows, setRows] = React.useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/c/${challengeId}/leaderboard`);
      const data = await res.json().catch(() => null);
      console.log("AdminLeaderboardList - Leaderboard data:", data);
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setLoading(false);
    })();
  }, [challengeId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("de-DE");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="card p-3 sm:p-4">
      <div className="font-semibold mb-3 text-sm sm:text-base">Leaderboard - Admin View</div>
      {loading ? (
        <div className="text-sm text-[var(--muted)]">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-[var(--muted)]">No entries yet.</div>
      ) : (
        <ol className="space-y-2 sm:space-y-3">
          {rows.slice(0, 10).map((r, i) => (
            <li key={r.userId} className="border border-white/10 rounded-lg p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className="w-6 text-right font-semibold text-brand text-sm sm:text-base">{i + 1}.</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-brand/20 to-brand/10 rounded-full flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link 
                      href={`/admin/users/${r.userId}/challenges/${challengeId}`}
                      className="block hover:text-brand transition"
                    >
                      <div className="font-medium truncate text-sm sm:text-base">
                        {r.userName || r.userEmail || r.userId}
                      </div>
                      <div className="text-xs sm:text-sm text-[var(--muted)] truncate">
                        {r.userEmail}
                      </div>
                      {r.userCreatedAt && (
                        <div className="flex items-center gap-1 text-xs text-[var(--muted)] mt-1">
                          <Calendar className="h-3 w-3" />
                          Seit {formatDate(r.userCreatedAt)}
                        </div>
                      )}
                    </Link>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base sm:text-lg font-bold text-brand">{r.count}</div>
                  <div className="text-xs text-[var(--muted)]">Check-ins</div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
