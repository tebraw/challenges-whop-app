"use client";
import React from "react";

type Row = { userId: string; count: number };

export default function LeaderboardList({ challengeId }: { challengeId: string }) {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/c/${challengeId}/leaderboard`);
      const data = await res.json().catch(() => null);
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setLoading(false);
    })();
  }, [challengeId]);

  return (
    <div className="card p-4">
      <div className="font-semibold mb-3">Leaderboard</div>
      {loading ? (
        <div className="text-sm text-[var(--muted)]">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-[var(--muted)]">No entries yet.</div>
      ) : (
        <ol className="space-y-2">
          {rows.slice(0, 10).map((r, i) => (
            <li key={r.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 text-right">{i + 1}.</span>
                <span className="font-medium">{r.userId}</span>
              </div>
              <span className="text-sm text-[var(--muted)]">{r.count} Check-ins</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
