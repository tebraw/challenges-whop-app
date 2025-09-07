"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Users, Calendar, Trophy, Settings, Eye, BarChart3, Flame, Camera, Zap, DollarSign, Target, TrendingUp, Pencil, Trash2 } from "lucide-react";
import EditChallengeModal from "@/components/admin/EditChallengeModal";

type ChallengeDetailData = {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  proofType: string;
  cadence: string;
  policy?: string;
  status: string;
  participants: number;
  checkins: number;
  averageCompletionRate: number; // Changed from totalStreaks
  imageUrl?: string;
  rewards?: Array<{
    place: number;
    title: string;
    description?: string;
  }>;
  leaderboard?: Array<{
    id: string;
    username: string;
    email: string;
    checkIns: number;
    completionRate?: number; // Changed from currentStreak to completionRate
    points?: number;
    joinedAt: string;
  }>;
  revenue?: {
    total: number;
    conversions: number;
  };
};

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit", 
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function getTimeRemaining(endDate: string) {
  try {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  } catch {
    return "Invalid date";
  }
}

function getChallengeStatus(startAt: string, endAt: string) {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);
  
  if (now < start) return "Scheduled";
  if (now > end) return "Ended";
  return "Live";
}

export default function AdminChallengeDetailPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<ChallengeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [challengeId, setChallengeId] = useState<string>("");
  const [whopProducts, setWhopProducts] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;
  }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [creatingOffer, setCreatingOffer] = useState<'completion' | 'mid-challenge' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function loadChallenge() {
      try {
        const resolvedParams = await params;
        setChallengeId(resolvedParams.challengeId);
        
        const response = await fetch(`/api/admin/challenges/${resolvedParams.challengeId}`);
        if (!response.ok) {
          throw new Error("Failed to load challenge");
        }
        
        const data = await response.json();
        
        // Prepare challenge data for the new dashboard
        const mockChallenge: ChallengeDetailData = {
          id: data.id,
          title: data.title || "Untitled Challenge",
          description: data.description,
          startAt: data.startAt,
          endAt: data.endAt,
          proofType: data.proofType || "TEXT",
          cadence: data.cadence || "DAILY",
          policy: data.rules,
          status: getChallengeStatus(data.startAt, data.endAt),
          participants: data.participants || 0,
          checkins: data.checkIns || 0,
          averageCompletionRate: data.averageCompletionRate || 0,
          imageUrl: data.imageUrl,
          rewards: data.rewards || [],
          leaderboard: data.leaderboard || [
            {
              id: "demo-user",
              username: "Demo User",
              email: "demo@example.com",
              checkIns: 1,
              joinedAt: new Date().toISOString()
            }
          ],
          revenue: {
            total: 0,
            conversions: 0
          }
        };
        
        setChallenge(mockChallenge);
        
        // Load Whop products for this challenge
        await loadWhopProducts(resolvedParams.challengeId);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadChallenge();
  }, [params]);

  async function loadWhopProducts(challengeId: string) {
    try {
      setLoadingProducts(true);
      console.log(`Loading Whop products for challenge: ${challengeId}`);
      
      const response = await fetch(`/api/admin/whop-products?challengeId=${challengeId}`);
      const data = await response.json();
      
      console.log('Whop products API response:', data);
      
      if (response.ok) {
        setWhopProducts(data.products || []);
        
        // Show debug information in console for troubleshooting
        if (data.debug) {
          console.log('Debug information:', data.debug);
        }
        
        // Show user-friendly messages
        if (data.products && data.products.length > 0) {
          console.log(`✅ Successfully loaded ${data.products.length} products from Whop`);
        } else {
          console.warn('⚠️ No products found:', data.message);
          if (data.debug) {
            console.log('Debug details:', data.debug);
          }
        }
      } else {
        console.error('❌ Failed to load Whop products:', data);
        setWhopProducts([]);
      }
    } catch (error) {
      console.error('❌ Error loading Whop products:', error);
      setWhopProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function createPromoCode(type: 'completion' | 'mid-challenge', productId: string, discount: string) {
    try {
      setCreatingOffer(type);
      
      // Parse discount (e.g., "15%" or "25%" -> 15 or 25)
      const discountMatch = discount.match(/(\d+)%?/);
      if (!discountMatch) {
        throw new Error('Invalid discount format');
      }
      
      const discountAmount = parseInt(discountMatch[1]);
      const promoCode = `${type.toUpperCase()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const response = await fetch('/api/admin/whop-promo-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: promoCode,
          amount_off: discountAmount,
          promo_type: 'percentage',
          plan_ids: [productId],
          unlimited_stock: true,
          new_users_only: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create promo code');
      }

      const result = await response.json();
      
      // Show success message
      alert(`✅ ${type === 'completion' ? 'Completion' : 'Mid-Challenge'} offer created successfully!\n\nPromo Code: ${result.promoCode.code}\nDiscount: ${discountAmount}% off`);
      
    } catch (error) {
      console.error('Error creating promo code:', error);
      alert(`❌ Failed to create ${type} offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreatingOffer(null);
    }
  }

  async function handleDeleteChallenge() {
    if (!challengeId || deleting) return;
    
    try {
      setDeleting(true);
      
      const response = await fetch(`/api/admin/challenges/${challengeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete challenge');
      }

      // Success - redirect to admin dashboard
      alert('✅ Challenge deleted successfully!');
      router.push('/admin');
      
    } catch (error) {
      console.error('Error deleting challenge:', error);
      alert(`❌ Failed to delete challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-8">
            <div className="text-gray-400">Loading challenge data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto p-6">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          
          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-400 mb-2">
                Error Loading Challenge
              </h2>
              <p className="text-gray-400 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Reload
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto p-6">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          
          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-300 mb-2">
                Challenge Not Found
              </h2>
              <p className="text-gray-400">
                The requested challenge does not exist or has been deleted.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              challenge.status === "Live" 
                ? "bg-green-600 text-green-100" 
                : challenge.status === "Scheduled"
                ? "bg-blue-600 text-blue-100"
                : "bg-gray-600 text-gray-100"
            }`}>
              {challenge.status}
            </span>
            <Button
              onClick={() => setEditModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Challenge
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Challenge Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Challenge Dashboard</h1>
          <p className="text-gray-400">Advanced analytics and marketing insights</p>
        </div>

        {/* Challenge Info Card */}
        <Card className="p-6 mb-6 bg-gray-800 border-gray-700">
          <div className="flex items-start gap-6">
            {/* Challenge Image */}
            <div className="shrink-0">
              <img
                src={challenge.imageUrl || "/logo-mark.png"}
                alt={challenge.title}
                className="h-24 w-24 rounded-xl object-cover border border-gray-600"
              />
            </div>
            
            {/* Challenge Details */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{challenge.title}</h2>
              {challenge.description && (
                <p className="text-gray-300 mb-4">{challenge.description}</p>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(challenge.startAt)} - {formatDate(challenge.endAt)}</span>
                <span>•</span>
                <span>{getTimeRemaining(challenge.endAt)}</span>
              </div>
              
              {/* Metrics Row */}
              <div className="grid grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{challenge.checkins}</div>
                    <div className="text-sm text-gray-400">Total Check-ins</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{challenge.participants}</div>
                    <div className="text-sm text-gray-400">Participants</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    {challenge.proofType === "PHOTO" ? <Camera className="h-5 w-5 text-white" /> : 
                     challenge.proofType === "LINK" ? <Target className="h-5 w-5 text-white" /> :
                     <BarChart3 className="h-5 w-5 text-white" />}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{challenge.proofType}</div>
                    <div className="text-sm text-gray-400">Proof Type</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-600 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{challenge.cadence}</div>
                    <div className="text-sm text-gray-400">Cadence</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Participants Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Participants</h3>
          </div>
          
          <Card className="p-6 bg-gray-800 border-gray-700">
            <h4 className="text-lg font-medium text-white mb-4">Leaderboard</h4>
            
            {challenge.leaderboard && challenge.leaderboard.length > 0 ? (
              <div className="space-y-3">
                {challenge.leaderboard.map((participant, index) => (
                  <div 
                    key={participant.id}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      index < 3 
                        ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30' 
                        : 'bg-gray-800/50 border border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-black' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {index < 3 ? (
                          index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-white">{participant.username}</p>
                        <p className="text-sm text-gray-400">{participant.email}</p>
                        <p className="text-sm text-gray-400">
                          {participant.completionRate || 0}% completion • {participant.checkIns} Check-ins
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-lg text-purple-400">{participant.points || 0}</span>
                      </div>
                      <p className="text-xs text-gray-400">Points</p>
                      <p className="text-xs text-gray-500">
                        Joined {formatDate(participant.joinedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400">No entries yet.</div>
              </div>
            )}
          </Card>
        </div>

        {/* Marketing & Monetization Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Marketing & Monetization</h3>
          </div>

          {/* Whop Connection Status */}
          {whopProducts.length === 0 && !loadingProducts && (
            <Card className="p-4 mb-6 bg-yellow-900 border-yellow-700">
              <div className="flex items-center gap-2 text-yellow-200">
                <DollarSign className="h-5 w-5" />
                <div>
                  <h4 className="font-medium">No Whop Products Found</h4>
                  <p className="text-sm text-yellow-300">
                    Connect your Whop account and add products to enable monetization features.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Monetization Status */}
          <Card className="p-6 mb-6 bg-gray-800 border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-green-400" />
              <h4 className="text-lg font-medium text-white">Monetization Status</h4>
              <span className="text-sm text-gray-400">Active offers and revenue tracking</span>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  ${challenge.revenue?.total || 0}
                </div>
                <div className="text-gray-400">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {challenge.revenue?.conversions || 0}
                </div>
                <div className="text-gray-400">Total Conversions</div>
              </div>
            </div>
          </Card>

          {/* Marketing Offers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Challenge Completion Offer */}
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-green-400" />
                <h4 className="text-lg font-medium text-white">Challenge Completion</h4>
              </div>
              <p className="text-gray-400 text-sm mb-4">Reward users who complete the challenge</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Product</label>
                  {loadingProducts ? (
                    <div className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400">
                      Loading products...
                    </div>
                  ) : (
                    <select 
                      id="completion-product"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      disabled={whopProducts.length === 0}
                    >
                      {whopProducts.length === 0 ? (
                        <option>No products available - Connect your Whop account</option>
                      ) : (
                        <>
                          <option value="">Select product...</option>
                          {whopProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} {product.price && product.currency ? `(${product.currency} ${product.price})` : ''}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discount (%)</label>
                  <input 
                    id="completion-discount"
                    type="number" 
                    defaultValue="15"
                    min="1"
                    max="100"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={whopProducts.length === 0 || creatingOffer === 'completion'}
                  onClick={() => {
                    const productSelect = document.getElementById('completion-product') as HTMLSelectElement;
                    const discountInput = document.getElementById('completion-discount') as HTMLInputElement;
                    
                    if (!productSelect.value) {
                      alert('Please select a product');
                      return;
                    }
                    
                    createPromoCode('completion', productSelect.value, `${discountInput.value}%`);
                  }}
                >
                  {creatingOffer === 'completion' ? 'Creating...' : 'Create Completion Offer'}
                </Button>
              </div>
            </Card>

            {/* Mid-Challenge Boost */}
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <h4 className="text-lg font-medium text-white">Mid-Challenge Boost</h4>
              </div>
              <p className="text-gray-400 text-sm mb-4">Motivate users during the challenge</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Product</label>
                  {loadingProducts ? (
                    <div className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400">
                      Loading products...
                    </div>
                  ) : (
                    <select 
                      id="boost-product"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      disabled={whopProducts.length === 0}
                    >
                      {whopProducts.length === 0 ? (
                        <option>No products available - Connect your Whop account</option>
                      ) : (
                        <>
                          <option value="">Select product...</option>
                          {whopProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} {product.price && product.currency ? `(${product.currency} ${product.price})` : ''}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discount (%)</label>
                  <input 
                    id="boost-discount"
                    type="number" 
                    defaultValue="25"
                    min="1"
                    max="100"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={whopProducts.length === 0 || creatingOffer === 'mid-challenge'}
                  onClick={() => {
                    const productSelect = document.getElementById('boost-product') as HTMLSelectElement;
                    const discountInput = document.getElementById('boost-discount') as HTMLInputElement;
                    
                    if (!productSelect.value) {
                      alert('Please select a product');
                      return;
                    }
                    
                    createPromoCode('mid-challenge', productSelect.value, `${discountInput.value}%`);
                  }}
                >
                  {creatingOffer === 'mid-challenge' ? 'Creating...' : 'Create Mid-Challenge Boost'}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Edit Modal */}
        {challengeId && (
          <EditChallengeModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            challengeId={challengeId}
            onSuccess={() => {
              // Refresh challenge data after successful edit
              window.location.reload();
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  Delete Challenge
                </h3>
                
                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete "{challenge?.title}"? This action cannot be undone.
                  All participants, check-ins, and data will be permanently removed.
                </p>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteChallenge}
                    disabled={deleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleting ? 'Deleting...' : 'Delete Challenge'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
