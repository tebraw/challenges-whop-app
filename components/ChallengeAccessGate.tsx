"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Lock, Users, Calendar, Star } from "lucide-react";

interface ChallengeAccessGateProps {
  challengeId: string;
  children?: React.ReactNode; // The actual challenge component when access is granted
}

interface PreviewData {
  title: string;
  description: string | null;
  duration: number;
  participantCount: number;
  creatorName: string;
  communityName: string;
  requiresMembership: boolean;
  isFree?: boolean;
  joinUrl?: string;
  rewards?: Array<{
    place: number;
    title: string;
    description?: string;
  }>;
}

export default function ChallengeAccessGate({ challengeId, children }: ChallengeAccessGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [challengeId]);

  const checkAccess = async () => {
    try {
      // Check with Whop authentication
      const response = await fetch(`/api/challenges/${challengeId}/access`, {
        credentials: 'include', // Include Whop session cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      setHasAccess(data.hasAccess);
      if (!data.hasAccess && data.preview) {
        setPreview(data.preview);
      }
    } catch (error) {
      console.error('Error checking challenge access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = () => {
    if (preview?.joinUrl) {
      window.open(preview.joinUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </main>
    );
  }

  // User has access - show the actual challenge component
  if (hasAccess) {
    return <>{children}</>;
  }

  // No access - show preview for non-members using our existing design system
  if (!hasAccess && preview) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-6">
          {/* Header with Lock Icon */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-10 w-10 text-gray-500 dark:text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{preview.title}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">{preview.description}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Calendar className="h-6 w-6 text-blue-500" />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{preview.duration}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Day Challenge</p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Users className="h-6 w-6 text-green-500" />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{preview.participantCount}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Participants</p>
            </Card>
          </div>

          {/* Creator Info */}
          <Card className="p-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Star className="h-6 w-6 text-yellow-500" />
                <span className="text-xl font-semibold text-gray-900 dark:text-white">{preview.creatorName}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium text-center">
                from the <span className="text-blue-600 dark:text-blue-400 font-semibold">{preview.communityName}</span> Community
              </p>
            </div>
          </Card>

          {/* Access Gate */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className={`${preview.isFree 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700' 
                : 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700'} border rounded-lg p-4`}>
                <div className="flex items-center gap-3 mb-2">
                  <Lock className={`h-5 w-5 ${preview.isFree ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
                  <span className={`font-semibold ${preview.isFree 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-amber-800 dark:text-amber-300'}`}>
                    {preview.isFree ? 'Free Community' : 'Premium Community Content'}
                  </span>
                </div>
                <p className={`text-sm ${preview.isFree 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-amber-700 dark:text-amber-300'}`}>
                  This challenge is only available for members of the <strong>{preview.communityName}</strong> community.
                  {preview.isFree ? ' Join for free!' : ' Become a premium member for exclusive content.'}
                </p>
              </div>
              
              <Button 
                onClick={handleJoinCommunity}
                className={`w-full font-semibold py-4 text-lg ${
                  preview.isFree 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
              >
                {preview.isFree ? '🆓 Join Free' : '💎 Premium Membership'}
              </Button>
              
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                {preview.isFree 
                  ? 'Free community membership'
                  : 'Creator receives revenue share from your membership'
                }
              </p>
            </div>
          </Card>

          {/* Rewards Preview */}
          {preview.rewards && preview.rewards.length > 0 && (
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">🏆 Challenge Rewards</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  These prizes await the challenge winners
                </p>
              </div>
              
              <div className="space-y-4">
                {preview.rewards.map((reward, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-800/30">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      reward.place === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      reward.place === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      'bg-gradient-to-br from-orange-400 to-orange-600'
                    }`}>
                      #{reward.place}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{reward.title}</h4>
                      {reward.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reward.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  💡 Join the community and compete for these prizes!
                </p>
              </div>
            </Card>
          )}

          {/* Benefits Preview */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">What awaits you:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Daily challenge updates</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Community interactions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Exclusive content</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Direct creator access</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // Fallback for errors
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Card className="p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Challenge not available</h2>
        <p className="text-gray-600 dark:text-gray-400">
          This challenge could not be loaded or is no longer available.
        </p>
      </Card>
    </main>
  );
}
