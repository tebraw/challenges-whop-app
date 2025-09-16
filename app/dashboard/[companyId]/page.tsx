"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Copy, Trash2, Pencil, BarChart3, Users, TrendingUp, DollarSign, Trophy } from "lucide-react";
import ChallengeCountdown from "@/components/ui/ChallengeCountdown";
import EditChallengeModal from "@/components/admin/EditChallengeModal";

type Challenge = {
  imageUrl: any;
  id: string;
  title: string;
  description?: string | null;
  startDate: string;    // Changed from startAt to startDate
  endDate: string;      // Changed from endAt to endDate
  proofType: "TEXT" | "PHOTO" | "LINK";
  rules?: any;
  createdAt: string;
  _count?: { enrollments: number };
  streakCount?: number;
};

function formatDate(dateString: string) {
  try {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit", 
      day: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
}

// Safe date range display component
function DateRange({ startDate, endDate }: { startDate: string; endDate: string }) {
  return (
    <span>
      📅 {formatDate(startDate)} - {formatDate(endDate)}
    </span>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = (params?.companyId as string) || 'unknown';
  
  const [items, setItems] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editChallengeId, setEditChallengeId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/challenges", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      const arr = Array.isArray(j?.challenges) ? (j.challenges as Challenge[]) : [];
      console.log('🔍 DEBUG: API Response challenges:', arr.map(c => ({ 
        id: c.id, 
        title: c.title, 
        startDate: c.startDate, 
        endDate: c.endDate,
        startDateType: typeof c.startDate,
        endDateType: typeof c.endDate
      })));
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

  // 🔧 FIX: Force reload when returning from challenge creation (refresh URL param)
  useEffect(() => {
    const refreshParam = searchParams?.get('refresh');
    if (refreshParam) {
      console.log("🔄 Detected refresh parameter, reloading challenges...");
      load();
      // Clean up the URL parameter after refresh
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('refresh');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);

  // 🔧 FIX: Reload data when user returns to this page (but not on every focus)
  useEffect(() => {
    let lastVisibilityChange = 0;
    
    const handleVisibilityChange = () => {
      const now = Date.now();
      // Only reload if page was hidden for more than 1 second (prevents click interference)
      if (!document.hidden && (now - lastVisibilityChange) > 1000) {
        console.log("🔄 Page became visible after being away, reloading challenges...");
        load();
      }
      lastVisibilityChange = now;
    };

    // Remove focus listener entirely - it was too aggressive
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  async function onDelete(id: string) {
    if (!confirm("Really delete challenge?")) return;
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  }

  const onEdit = (id: string) => {
    setEditChallengeId(id);
    setEditModalOpen(true);
  };

  async function onDuplicate(id: string) {
    try {
      const res = await fetch(`/api/admin/challenges/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      alert(e?.message || "Copy failed");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 pt-24 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Challenge Dashboard</h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage your challenges and track performance</p>
          </div>
          <Link href={`/dashboard/${companyId}/new`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto px-6 py-3 rounded-xl font-semibold transition-colors">
              + New Challenge
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{items.length}</div>
                  <div className="text-sm text-gray-400">Total Challenges</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {items.reduce((sum, c) => sum + (c._count?.enrollments ?? 0), 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Participants</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {items.reduce((sum, c) => sum + (c.streakCount ?? 0), 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Check-ins</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(items.reduce((sum, c) => sum + (c._count?.enrollments ?? 0), 0) * 0.12)}
                  </div>
                  <div className="text-sm text-gray-400">Conversion Potential</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading challenges...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-500 rounded-xl p-6 text-red-200">
            Error: {error}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-2">No challenges created yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first challenge to start engaging your community and building your brand.
            </p>
            <Link href={`/dashboard/${companyId}/new`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
                Create Your First Challenge
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((c) => {
              const rules = (c.rules ?? {}) as any;
              const img: string | undefined = rules.imageUrl || c.imageUrl;
              const max = rules.maxParticipants as number | undefined;
              const count = c._count?.enrollments ?? 0;
              const streakCount = c.streakCount ?? 0;
              
              // Safe status calculation with fallback
              let status = "Scheduled";
              try {
                if (c.startDate && c.endDate) {
                  const startDate = new Date(c.startDate);
                  const endDate = new Date(c.endDate);
                  const now = new Date();
                  
                  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    status = "Unknown";
                  } else if (now < startDate) {
                    status = "Scheduled";
                  } else if (now > endDate) {
                    status = "Completed";
                  } else {
                    status = "Live";
                  }
                }
              } catch (error) {
                console.warn('Error calculating status for challenge:', c.id, error);
                status = "Unknown";
              }
              
              // Extract marketing data from rules
              const marketingRules = (c.rules ?? {}) as any;
              const category = marketingRules.category;
              const difficulty = marketingRules.difficulty;
              const tags = marketingRules.tags || [];
              const monetizationEnabled = marketingRules.monetization?.enabled || false;

              return (
                <div key={c.id} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors">
                  <div className="flex items-center justify-between">
                    <Link href={`/dashboard/${companyId}/c/${c.id}`} className="flex items-center gap-4 flex-1 group" style={{ textDecoration: 'none' }}>
                      {/* Thumbnail */}
                      <div className="shrink-0">
                        <img
                          src={img || "/logo-mark.png"}
                          alt=""
                          className="h-16 w-16 rounded-xl object-cover border border-gray-600 group-hover:scale-105 transition"
                        />
                      </div>

                      {/* Main Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">{c.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === "Live" ? "bg-green-600 text-green-100" : 
                            status === "Scheduled" ? "bg-blue-600 text-blue-100" : 
                            "bg-gray-600 text-gray-100"
                          }`}>
                            {status}
                          </span>
                          {monetizationEnabled && (
                            <span className="bg-purple-600 text-purple-100 px-2 py-1 rounded-full text-xs font-medium">
                              💰 Monetized
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                          <div className="flex items-center">
                            <DateRange startDate={c.startDate} endDate={c.endDate} />
                          </div>
                          <div className="flex items-center">
                            👥 {count}{max ? `/${max}` : ""} participants
                          </div>
                          <div className="flex items-center">
                            🔥 {streakCount} check-ins
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {/* Winners button - nur für beendete Challenges */}
                      {status === "Completed" && (
                        <Link href={`/dashboard/${companyId}/winners/${c.id}`}>
                          <button className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-lg transition-colors" title="Select Winners">
                            <Trophy className="h-4 w-4" />
                          </button>
                        </Link>
                      )}
                      <Link href={`/dashboard/${companyId}/c/${c.id}`}>
                        <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors" title="Analytics">
                          <BarChart3 className="h-4 w-4" />
                        </button>
                      </Link>
                      <button 
                        onClick={() => onEdit(c.id)}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors" 
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => onDuplicate(c.id)} 
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors" 
                        title="Copy"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(c.id)} 
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editChallengeId && (
        <EditChallengeModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditChallengeId(null);
          }}
          challengeId={editChallengeId}
          onSuccess={() => {
            load(); // Refresh the list after successful edit
          }}
        />
      )}
    </div>
  );
}
