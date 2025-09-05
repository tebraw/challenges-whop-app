"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Copy, Trash2, Pencil, BarChart3, Users, TrendingUp, DollarSign, Trophy } from "lucide-react";
import ChallengeCountdown from "@/components/ui/ChallengeCountdown";

type Challenge = {
  imageUrl: any;
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  proofType: "TEXT" | "PHOTO" | "LINK";
  rules?: any;
  createdAt: string;
  _count?: { enrollments: number };
  streakCount?: number;
};

function fmt(d: string) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

export default function AdminList() {
  const [items, setItems] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/challenges", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      const arr = Array.isArray(j?.challenges) ? (j.challenges as Challenge[]) : [];
      setItems(arr);
    } catch (e: any) {
      setError(e?.message || "Loading error");
      setItems([]); // <- niemals undefined setzen
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: string) {
    if (!confirm("Really delete challenge?")) return;
    try {
      const res = await fetch(`/api/challenges/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  }

  async function onDuplicate(id: string) {
    try {
      const res = await fetch(`/api/challenges/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      alert(e?.message || "Copy failed");
    }
  }

  return (
    <main className="gradient-hero">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 pt-8 md:pt-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Challenge Dashboard</h1>
            <p className="text-muted text-sm sm:text-base">Manage your challenges and track performance</p>
          </div>
          <Link href="/admin/new">
            <Button className="bg-brand text-black hover:bg-brand/90 w-full sm:w-auto">New Challenge</Button>
          </Link>
        </div>

        {/* Quick Stats */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-brand/10 rounded-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-brand" />
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-bold">{items.length}</div>
                  <div className="text-xs sm:text-sm text-muted">Total Challenges</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-bold">
                    {items.reduce((sum, c) => sum + (c._count?.enrollments ?? 0), 0)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted">Total Participants</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-bold">
                    {items.reduce((sum, c) => sum + (c.streakCount ?? 0), 0)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted">Total Check-ins</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-bold">
                    {Math.round(items.reduce((sum, c) => sum + (c._count?.enrollments ?? 0), 0) * 0.12)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted">Conversion Potential</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {loading ? (
          <div>loading…</div>
        ) : error ? (
          <Card className="text-red-300">Error: {error}</Card>
        ) : items.length === 0 ? (
          <Card>No challenges created.</Card>
        ) : (
          <div className="space-y-3">
            {items.map((c) => {
              const rules = (c.rules ?? {}) as any;
              const img: string | undefined = rules.imageUrl || c.imageUrl;
              const max = rules.maxParticipants as number | undefined;
              const count = c._count?.enrollments ?? 0;
              const streakCount = c.streakCount ?? 0;
              const isActive = new Date(c.startAt) <= new Date() && new Date() <= new Date(c.endAt);
              const status = new Date(c.startAt) > new Date() ? "Scheduled" : isActive ? "Live" : "Completed";
              
              // Calculate simple engagement metrics
              const challengeDays = Math.ceil(
                (new Date(c.endAt).getTime() - new Date(c.startAt).getTime()) / (1000 * 60 * 60 * 24)
              );
              const avgEngagement = count > 0 ? Math.round((streakCount / (count * Math.max(1, challengeDays))) * 100) : 0;
              const conversionScore = Math.min(100, Math.round(avgEngagement * 0.8 + (count > 10 ? 20 : 0)));
              
              // Extract marketing data from rules
              const marketingRules = (c.rules ?? {}) as any;
              const category = marketingRules.category;
              const difficulty = marketingRules.difficulty;
              const tags = marketingRules.tags || [];
              const monetizationEnabled = marketingRules.monetization?.enabled || false;

              return (
                <Card key={c.id} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <Link href={`/admin/c/${c.id}`} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 group" style={{ textDecoration: 'none' }}>
                      {/* Thumbnail */}
                      <div className="shrink-0 self-center sm:self-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img || "/logo-mark.png"}
                          alt=""
                          className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition"
                        />
                      </div>

                      {/* Main Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <div className="truncate text-base sm:text-lg font-semibold group-hover:text-brand transition">{c.title}</div>
                          <div className="flex flex-wrap gap-1">
                            <Badge className={status === "Live" ? "bg-green-500" : status === "Scheduled" ? "bg-blue-500" : "bg-gray-500"}>
                              {status}
                            </Badge>
                            {monetizationEnabled && (
                              <Badge className="bg-purple-500">💰 Monetized</Badge>
                            )}
                            {difficulty && (
                              <Badge className="bg-orange-500">{difficulty}</Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Tags row */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {tags.slice(0, 3).map((tag: string, i: number) => (
                              <span key={i} className="text-xs bg-brand/20 text-brand px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                            {tags.length > 3 && (
                              <span className="text-xs text-muted">+{tags.length - 3} more</span>
                            )}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                          <div>
                            <div className="text-muted text-xs sm:text-sm">Timeline</div>
                            <div className="font-medium text-sm">
                              {fmt(c.startAt)} – {fmt(c.endAt)}
                            </div>
                            <div className="text-xs"><ChallengeCountdown endDate={c.endAt} /></div>
                            {category && (
                              <div className="text-xs text-muted mt-1">📂 {category}</div>
                            )}
                          </div>
                          
                          <div>
                            <div className="text-muted text-xs sm:text-sm">Participants</div>
                            <div className="font-medium text-sm">👥 {count}{max ? `/${max}` : ""}</div>
                            <div className="text-xs">🔥 {streakCount} check-ins</div>
                          </div>
                          
                          <div>
                            <div className="text-muted text-xs sm:text-sm">Engagement</div>
                            <div className="font-medium text-sm">{avgEngagement}%</div>
                            <div className="text-xs">📝 {c.proofType}</div>
                          </div>
                          
                          <div>
                            <div className="text-muted text-xs sm:text-sm">Business Potential</div>
                            <div className="font-medium flex items-center gap-1 text-sm">
                              <DollarSign className="h-3 w-3" />
                              {conversionScore}%
                            </div>
                            <div className="text-xs">Conversion Score</div>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Actions - Mobile: Horizontal scroll, Desktop: Vertical */}
                    <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
                      {/* Winners button - nur für beendete Challenges */}
                      {new Date() > new Date(c.endAt) && (
                        <Link href={`/admin/winners/${c.id}`} className="shrink-0">
                          <Button variant="outline" radius="lg" title="Select Winners" className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200 min-w-[44px] h-[44px] p-2">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/admin/c/${c.id}`} className="shrink-0">
                        <Button variant="outline" radius="lg" title="Analytics" className="min-w-[44px] h-[44px] p-2">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/edit/${c.id}`} className="shrink-0">
                        <Button variant="outline" radius="lg" title="Edit" className="min-w-[44px] h-[44px] p-2">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" radius="lg" title="Copy" onClick={() => onDuplicate(c.id)} className="shrink-0 min-w-[44px] h-[44px] p-2">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" radius="lg" title="Delete" onClick={() => onDelete(c.id)} className="shrink-0 min-w-[44px] h-[44px] p-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
