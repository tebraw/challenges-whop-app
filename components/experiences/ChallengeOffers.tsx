'use client';

import { useEffect, useState } from 'react';
import { Gift, Percent, Clock, ExternalLink, Lock, Unlock } from 'lucide-react';

interface ChallengeOffer {
  id: string;
  offerType: string;
  whopProductId: string;
  productName: string;
  productDescription: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  customMessage: string;
  timeLimit: number;
  isActive: boolean;
  createdAt: string;
  isEligible: boolean;
  requiredProgress: string;
}

interface UserStats {
  completionRate: number;
  completedCheckIns: number;
  maxCheckIns: number;
  totalProofs: number;
}

interface OffersResponse {
  offers: ChallengeOffer[];
  userStats: UserStats;
}

interface ChallengeOffersProps {
  challengeId: string;
  whopHeaders: {
    userToken?: string;
    userId: string;
    experienceId: string;
    companyId?: string;
  };
}

export default function ChallengeOffers({ challengeId, whopHeaders }: ChallengeOffersProps) {
  const [offers, setOffers] = useState<ChallengeOffer[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    loadOffers();
  }, [challengeId]);

  async function loadOffers() {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/challenges/${challengeId}/offers`, {
        headers: {
          'x-whop-user-token': whopHeaders.userToken || '',
          'x-whop-user-id': whopHeaders.userId,
          'x-whop-experience-id': whopHeaders.experienceId,
          'x-whop-company-id': whopHeaders.companyId || ''
        }
      });

      if (response.ok) {
        const data: OffersResponse = await response.json();
        setOffers(data.offers || []);
        setUserStats(data.userStats || null);
      } else {
        console.error('Failed to load offers:', await response.text());
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function claimOffer(offerId: string) {
    try {
      const offer = offers.find(o => o.id === offerId);
      if (!offer || !offer.isEligible) {
        alert('This offer is not yet available. Keep progressing to unlock it!');
        return;
      }

      setClaiming(offerId);
      
      const response = await fetch(`/api/challenges/${challengeId}/claim-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-whop-user-token': whopHeaders.userToken || '',
          'x-whop-user-id': whopHeaders.userId,
          'x-whop-experience-id': whopHeaders.experienceId,
          'x-whop-company-id': whopHeaders.companyId || ''
        },
        body: JSON.stringify({ offerId })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show success modal with promo code and checkout link
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
          <div class="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-green-500/30 text-center">
            <div class="text-6xl mb-4">🎉</div>
            <h3 class="text-2xl font-bold text-white mb-4">Offer Claimed!</h3>
            <div class="bg-green-500/20 border border-green-500/40 rounded-xl p-4 mb-6">
              <p class="text-green-300 font-medium mb-2">Your Promo Code:</p>
              <div class="text-xl font-bold text-white bg-green-500/30 rounded-lg p-3 font-mono">
                ${result.promoCode}
              </div>
            </div>
            <p class="text-gray-300 mb-2">${result.message}</p>
            <p class="text-sm text-gray-400 mb-6">
              Save ${result.discount.percentage}% on ${result.productName}
            </p>
            <div class="flex gap-3">
              <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors">
                Close
              </button>
              <a href="${result.checkoutUrl}" target="_blank" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <span>Buy Now</span>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/><path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z"/></svg>
              </a>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        
        // Remove the claimed offer from display
        setOffers(prev => prev.filter(offer => offer.id !== offerId));
        
      } else {
        const error = await response.json();
        alert(`Failed to claim offer: ${error.error}`);
      }
    } catch (error) {
      console.error('Error claiming offer:', error);
      alert('Failed to claim offer. Please try again.');
    } finally {
      setClaiming(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">Loading special offers...</div>
      </div>
    );
  }

  if (offers.length === 0) {
    return null; // Don't show anything if no offers exist for this challenge
  }

  // Split offers into eligible (unlocked) and locked
  const eligibleOffers = offers.filter(offer => offer.isEligible);
  const lockedOffers = offers.filter(offer => !offer.isEligible);

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-8 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
          <span className="text-4xl">🎁</span>
          Challenge Rewards & Milestones
        </h2>
        <p className="text-gray-300 text-lg">
          {eligibleOffers.length > 0 
            ? "You've unlocked exclusive rewards! Plus see what awaits you ahead." 
            : "Keep going to unlock amazing rewards as you progress!"
          }
        </p>
        {userStats && (
          <div className="mt-4 text-sm text-gray-400">
            Your Progress: {userStats.completedCheckIns}/{userStats.maxCheckIns} check-ins ({userStats.completionRate}% complete)
          </div>
        )}
      </div>
      
      <div className="space-y-8">
        {/* Unlocked Offers Section */}
        {eligibleOffers.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Unlock className="h-6 w-6 text-green-400" />
              <h3 className="text-2xl font-bold text-green-400">Available Now!</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {eligibleOffers.map((offer) => (
                <div 
                  key={offer.id}
                  className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300 group"
                >
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {offer.offerType === 'completion' ? '🏆' : '⚡'}
                    </div>
                    <h3 className="text-xl font-bold text-yellow-300 mb-2">
                      {offer.offerType === 'completion' ? 'Completion Reward' : 'Mid-Challenge Boost'}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white mb-2">
                      <Percent className="h-6 w-6" />
                      <span>{offer.discountPercentage}% OFF</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">
                      {offer.customMessage || `Save ${offer.discountPercentage}% on ${offer.productName}`}
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Product:</span>
                      <span className="text-white font-medium">{offer.productName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Original Price:</span>
                      <span className="text-gray-400 line-through">${offer.originalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Your Price:</span>
                      <span className="text-green-400 font-bold text-lg">${offer.discountedPrice}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => claimOffer(offer.id)}
                    disabled={claiming === offer.id}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25 flex items-center justify-center gap-2"
                  >
                    {claiming === offer.id ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        <span>Claiming...</span>
                      </>
                    ) : (
                      <>
                        <Gift className="h-5 w-5" />
                        <span>Claim {offer.discountPercentage}% Discount</span>
                      </>
                    )}
                  </button>
                  
                  {offer.timeLimit && (
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-3">
                      <Clock className="h-4 w-4" />
                      <span>Limited time offer</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Offers Section */}
        {lockedOffers.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Lock className="h-6 w-6 text-gray-500" />
              <h3 className="text-2xl font-bold text-gray-400">Future Rewards</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {lockedOffers.map((offer) => (
                <div 
                  key={offer.id}
                  className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-2xl p-6 opacity-60 relative overflow-hidden"
                >
                  {/* Lock Overlay */}
                  <div className="absolute top-4 right-4">
                    <Lock className="h-8 w-8 text-gray-500" />
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-3 grayscale">
                      {offer.offerType === 'completion' ? '🏆' : '⚡'}
                    </div>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">
                      {offer.offerType === 'completion' ? 'Completion Reward' : 'Mid-Challenge Boost'}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-400 mb-2">
                      <Percent className="h-6 w-6" />
                      <span>{offer.discountPercentage}% OFF</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">
                      {offer.customMessage || `Save ${offer.discountPercentage}% on ${offer.productName}`}
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Product:</span>
                      <span className="text-gray-400 font-medium">{offer.productName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Original Price:</span>
                      <span className="text-gray-500 line-through">${offer.originalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Discounted Price:</span>
                      <span className="text-gray-400 font-bold text-lg">${offer.discountedPrice}</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-600/50 text-gray-400 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <Lock className="h-5 w-5" />
                    <span>Requires: {offer.requiredProgress}</span>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      Keep going to unlock this reward!
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}