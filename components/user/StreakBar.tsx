export default function StreakBar({
  totalDays,
  doneDays,
  photoDays = [],
}: { totalDays: number; doneDays: number; photoDays?: number[] }) {
  // END_OF_CHALLENGE: Immer nur ein Punkt, egal wie viele Check-ins
  const items = totalDays === 1 ? [doneDays > 0] : Array.from({ length: totalDays }, (_, i) => i < doneDays);
  return (
    <div className="card p-4">
      <div className="mb-2 text-sm text-[var(--muted)]">
        Streak: {doneDays} / {totalDays}
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((ok, i) => {
          let emoji = ok ? "🔥" : "·";
          if (photoDays.includes(i + 1)) emoji = "🖼️";
          return (
            <span
              key={i}
              className={
                "inline-flex h-6 w-6 items-center justify-center rounded-md text-sm " +
                (ok ? "bg-[var(--brand)] text-black" : "bg-white/5")
              }
              title={`Day ${i + 1}`}
            >
              {emoji}
            </span>
          );
        })}
      </div>
    </div>
  );
}
