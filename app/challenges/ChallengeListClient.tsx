"use client";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ChallengeCountdown from "@/components/ui/ChallengeCountdown";
import Link from "next/link";

interface Challenge {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  startAt: string | Date;
  endAt: string | Date;
  proofType: string;
  rules: string;
  createdAt: string | Date;
  imageUrl: string | null;
}

function statusPill(startAt: Date | string, endAt: Date | string) {
  const now = new Date().getTime();
  const s = new Date(startAt).getTime();
  const e = new Date(endAt).getTime();
  if (now < s) return <span className="rounded-full bg-sky-100 text-sky-700 px-2 py-0.5 text-xs">Geplant</span>;
  if (now > e) return <span className="rounded-full bg-zinc-200 text-zinc-700 px-2 py-0.5 text-xs">Ended</span>;
  return <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs">Live</span>;
}

function proofLabel(p: string) {
  switch (p) {
    case "PHOTO": return "PHOTO";
    case "TEXT": return "TEXT";
    case "LINK": return "LINK";
    default: return "NONE";
  }
}

export default function ChallengeListClient({ rows, isAdmin = false }: { rows: Challenge[]; isAdmin?: boolean }) {
  if (rows.length === 0) {
    return <div className="card p-6 text-[var(--muted)]">No challenges yet.</div>;
  }
  return (
    <div className="space-y-3">
      {rows.map((ch) => {
        // Extract image URL from rules or top-level imageUrl
        let imageUrl = ch.imageUrl;
        try {
          const rules = JSON.parse(ch.rules || '{}');
          imageUrl = rules.imageUrl || ch.imageUrl;
        } catch {
          // If rules parsing fails, use the top-level imageUrl
        }

        return (
          <Card key={ch.id} className="p-3">
            {/* Mobile Layout - Stack vertically on small screens */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {/* Thumbnail - Smaller on mobile */}
              <div className="shrink-0 self-start sm:self-auto">
                <img
                  src={imageUrl || "/logo-mark.png"}
                  alt={ch.title}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover border border-white/10"
                />
              </div>
              
              {/* Content - Full width on mobile */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="text-lg sm:text-xl font-semibold line-clamp-2 sm:truncate">{ch.title}</div>
                  <div className="flex-shrink-0">
                    {statusPill(ch.startAt, ch.endAt)}
                  </div>
                </div>
                
                {/* Meta info - Stack on mobile */}
                <div className="mt-2 text-sm text-[var(--muted)] space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                  <span className="block sm:inline">📅 {new Date(ch.startAt).toLocaleDateString()} – {new Date(ch.endAt).toLocaleDateString()}</span>
                  {isAdmin && <span className="block sm:inline">📝 {proofLabel(ch.proofType)}</span>}
                  <span className="block sm:inline sm:ml-2">
                    <ChallengeCountdown endDate={ch.endAt} />
                  </span>
                </div>
              </div>
              
              {/* Button - Full width on mobile */}
              <div className="flex-shrink-0 w-full sm:w-auto sm:ml-auto">
                <Link href={`/c/${ch.id}`} className="block">
                  <Button 
                    variant="outline" 
                    radius="lg" 
                    className="w-full sm:w-auto px-6 py-2 text-base sm:text-sm"
                  >
                    <span className="sm:hidden">🎯 Join Challenge</span>
                    <span className="hidden sm:inline">Open →</span>
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
