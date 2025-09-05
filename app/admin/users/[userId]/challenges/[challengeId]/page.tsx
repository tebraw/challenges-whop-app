"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Calendar, User, Mail, Camera, Link2, FileText, ChevronDown, ChevronRight, Eye } from "lucide-react";

type UserChallengeData = {
  user: {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
  };
  challenge: {
    id: string;
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    proofType: string;
  };
  enrollment: {
    id: string;
    joinedAt: string;
    checkins: Array<{
      id: string;
      createdAt: string;
      text?: string;
      imageUrl?: string;
      linkUrl?: string;
    }>;
  };
};

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit", 
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function getProofTypeIcon(type: string) {
  switch (type) {
    case "PHOTO":
      return <Camera className="h-4 w-4" />;
    case "LINK":
      return <Link2 className="h-4 w-4" />;
    case "TEXT":
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

export default function AdminUserChallengePage({
  params,
}: {
  params: Promise<{ userId: string; challengeId: string }>;
}) {
  const router = useRouter();
  const [data, setData] = useState<UserChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ userId: string; challengeId: string } | null>(null);
  const [expandedCheckins, setExpandedCheckins] = useState<Set<string>>(new Set());
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const toggleCheckinExpansion = (checkinId: string) => {
    setExpandedCheckins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(checkinId)) {
        newSet.delete(checkinId);
      } else {
        newSet.add(checkinId);
      }
      return newSet;
    });
  };

  const openImageModal = (imageUrl: string) => {
    setImageModalUrl(imageUrl);
  };

  const closeImageModal = () => {
    setImageModalUrl(null);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageModalUrl) {
        closeImageModal();
      }
    };

    if (imageModalUrl) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [imageModalUrl]);

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params;
      setResolvedParams(resolved);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/users/${resolvedParams!.userId}/challenges/${resolvedParams!.challengeId}`);
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const result = await res.json();
        if (!result.ok) {
          throw new Error(result.message || "Error loading data");
        }
        setData(result);
      } catch (e: any) {
        setError(e?.message || "Error loading data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [resolvedParams]);

  if (!resolvedParams || loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">Loading user data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-red-300 p-6">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6">
          <p>No data found.</p>
        </Card>
      </div>
    );
  }

  const { user, challenge, enrollment } = data;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          radius="lg"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">User Details</h1>
      </div>

      {/* User Info */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-brand/20 to-brand/10 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-brand" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {user.name || user.email}
            </h2>
            <div className="flex items-center gap-2 text-muted">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted mt-1">
              <Calendar className="h-4 w-4" />
              Registriert: {formatDate(user.createdAt)}
            </div>
          </div>
        </div>
      </Card>

      {/* Challenge Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Challenge: {challenge.title}</h3>
        {challenge.description && (
          <p className="text-muted mb-3">{challenge.description}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted">Start:</span>
            <div className="font-medium">{formatDate(challenge.startAt)}</div>
          </div>
          <div>
            <span className="text-muted">End:</span>
            <div className="font-medium">{formatDate(challenge.endAt)}</div>
          </div>
          <div>
            <span className="text-muted">Joined:</span>
            <div className="font-medium">{formatDate(enrollment.joinedAt)}</div>
          </div>
        </div>
      </Card>

      {/* Debug Info (can be removed in production) */}
      {false && process.env.NODE_ENV === 'development' && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
          <h4 className="text-sm font-semibold text-yellow-300 mb-2">🐛 Debug Info</h4>
          <div className="text-xs text-yellow-200 space-y-1">
            <div>User ID: {user.id}</div>
            <div>Challenge ID: {challenge.id}</div>
            <div>Check-ins: {enrollment.checkins.length}</div>
            <details className="mt-2">
              <summary className="cursor-pointer text-yellow-300">Show Check-in Data</summary>
              <div className="mt-2 bg-black/30 rounded p-2 max-h-40 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify({ 
                    user: { id: user.id, email: user.email, name: user.name },
                    challenge: { id: challenge.id, title: challenge.title },
                    enrollment: {
                      checkins: enrollment.checkins.map(c => ({ 
                        id: c.id, 
                        date: new Date(c.createdAt).toLocaleDateString(),
                        hasText: !!c.text, 
                        hasImage: !!c.imageUrl, 
                        hasLink: !!c.linkUrl,
                        isEmpty: !c.text && !c.imageUrl && !c.linkUrl
                      }))
                    }
                  }, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-brand">
            {enrollment.checkins.length}
          </div>
          <div className="text-sm text-muted">Check-ins</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-brand">
            {enrollment.checkins.filter(c => c.text || c.imageUrl || c.linkUrl).length}
          </div>
          <div className="text-sm text-muted">With content</div>
        </Card>
      </div>

      {/* Check-ins */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Check-ins ({enrollment.checkins.length})</h3>
          {enrollment.checkins.length > 0 && (
            <div className="text-sm text-muted flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Click for details
            </div>
          )}
        </div>
        {enrollment.checkins.length === 0 ? (
          <div className="text-muted text-sm">
            <div className="mb-2">No check-ins available.</div>
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs bg-red-500/10 border border-red-500/20 rounded p-2">
                Debug: User {user.id} has no check-ins for Challenge {challenge.id}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {enrollment.checkins.map((checkin) => {
              const isExpanded = expandedCheckins.has(checkin.id);
              const hasContent = checkin.text || checkin.imageUrl || checkin.linkUrl;
              
              return (
                <div key={checkin.id} className="border border-white/10 rounded-lg overflow-hidden">
                  {/* Check-in Header - Always visible */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {hasContent && (
                            <button
                              onClick={() => toggleCheckinExpansion(checkin.id)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          )}
                          <Calendar className="h-4 w-4 text-brand" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {formatDate(checkin.createdAt)}
                          </div>
                          <div className="text-sm text-muted">
                            {hasContent 
                              ? `${checkin.text ? 'Text' : ''}${checkin.text && (checkin.imageUrl || checkin.linkUrl) ? ', ' : ''}${checkin.imageUrl ? 'Image' : ''}${(checkin.text || checkin.imageUrl) && checkin.linkUrl ? ', ' : ''}${checkin.linkUrl ? 'Link' : ''}`
                              : 'Leerer Check-in (nur Zeitstempel)'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasContent ? (
                          <>
                            <Eye className="h-4 w-4 text-muted" />
                            <button
                              onClick={() => toggleCheckinExpansion(checkin.id)}
                              className="text-sm text-muted hover:text-brand transition"
                            >
                              {isExpanded ? 'Less' : 'Details'}
                            </button>
                          </>
                        ) : (
                          <div className="text-xs text-muted bg-white/5 rounded px-2 py-1">
                            No upload
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Show empty checkin info directly if no content */}
                    {!hasContent && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg border-l-2 border-orange-500/50">
                        <div className="text-sm text-orange-200">
                          <strong>Info:</strong> This check-in was created but saved without content. 
                          The user may have only clicked the "Check-in" button without adding text, image, or link.
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Expandable Content - only if has content */}
                  {isExpanded && hasContent && (
                    <div className="border-t border-white/10 p-4 bg-white/2">
                      {checkin.text && (
                        <div className="mb-4">
                          <div className="text-sm text-muted mb-2 font-medium">📝 Text-Eingabe:</div>
                          <div className="bg-white/5 rounded-lg p-3 text-sm">
                            {checkin.text}
                          </div>
                        </div>
                      )}
                      
                      {checkin.imageUrl && (
                        <div className="mb-4">
                          <div className="text-sm text-muted mb-2 font-medium">🖼️ Uploaded image:</div>
                          <div className="relative">
                            <img
                              src={checkin.imageUrl}
                              alt="Check-in Upload"
                              className="rounded-lg max-w-full max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/10"
                              onClick={() => openImageModal(checkin.imageUrl!)}
                            />
                            <div className="absolute top-2 right-2">
                              <Button
                                variant="outline"
                                radius="lg"
                                className="bg-black/50 border-white/20 text-white hover:bg-black/70"
                                onClick={() => openImageModal(checkin.imageUrl!)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {checkin.linkUrl && (
                        <div className="mb-2">
                          <div className="text-sm text-muted mb-2 font-medium">🔗 Link:</div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <a
                              href={checkin.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand hover:underline text-sm break-all inline-flex items-center gap-2"
                            >
                              <Link2 className="h-4 w-4" />
                              {checkin.linkUrl}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Image Modal */}
      {imageModalUrl && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={imageModalUrl}
              alt="Full Size"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
