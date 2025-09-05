"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { 
  Gift, 
  Star, 
  ExternalLink, 
  Clock,
  Target,
  Award,
  Zap
} from "lucide-react";

interface MonetizationOffer {
  id: string;
  type: 'completion' | 'engagement' | 'milestone';
  title: string;
  description: string;
  productName: string;
  originalPrice?: string;
  discountPrice?: string;
  discount?: number;
  urgency?: string;
  ctaText: string;
  ctaUrl: string;
  badge?: string;
}

interface UserMonetizationProps {
  challengeId: string;
  userId: string;
  userProgress: {
    completionRate: number;
    isCompleted: boolean;
    streakCount: number;
    isHighEngagement: boolean;
    daysSinceStart: number;
  };
  monetizationRules: {
    enabled: boolean;
    // New offers system
    offers?: Array<{
      id?: string;
      type: string;
      productName?: string;
      originalPrice: number;
      discountPercentage: number;
      discountedPrice?: number;
      timeLimit?: number;
      customMessage?: string;
      checkoutUrl?: string;
      triggerConditions?: any;
    }>;
    // Legacy system for backward compatibility
    completionOffer?: {
      productName: string;
      productId: string;
      productUrl: string;
      originalPrice: number;
      discountPercent: number;
    };
    engagementOffer?: {
      productName: string;
      productId: string;
      productUrl: string;
      originalPrice: number;
      discountPercent: number;
    };
    milestoneOffers?: Array<{
      milestone: string;
      productName: string;
      productId: string;
      productUrl: string;
      originalPrice: number;
      discountPercent: number;
    }>;
  };
}

export default function UserMonetization({ 
  challengeId, 
  userId, 
  userProgress, 
  monetizationRules 
}: UserMonetizationProps) {
  const [availableOffers, setAvailableOffers] = useState<MonetizationOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<MonetizationOffer | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // If there are offers in the new system, automatically enable monetization
    const hasOffers = monetizationRules.offers && monetizationRules.offers.length > 0;
    const isEnabled = monetizationRules.enabled || hasOffers;
    
    if (!isEnabled) return;

    const offers: MonetizationOffer[] = [];

    // NEW SYSTEM: Process offers from monetizationRules.offers array
    if (monetizationRules.offers && Array.isArray(monetizationRules.offers)) {
      monetizationRules.offers.forEach((offer: any, index: number) => {
        // Check if offer should be shown based on trigger conditions
        let shouldShow = false;

        if (offer.type === 'completion' && userProgress.isCompleted) {
          shouldShow = true;
        } else if (offer.type === 'mid_challenge' && !userProgress.isCompleted) {
          // Show mid-challenge offers for enrolled users
          shouldShow = true;
        } else if (offer.type === 'engagement' && userProgress.isHighEngagement) {
          shouldShow = true;
        }

        if (shouldShow) {
          const discountedPrice = offer.discountedPrice || Math.round(offer.originalPrice * (1 - offer.discountPercentage / 100));
          
          offers.push({
            id: offer.id || offer.type,
            type: offer.type,
            title: offer.type === 'completion' ? '🎉 Congratulations! Special Completion Offer' : 
                   offer.type === 'mid_challenge' ? '⚡ Exclusive Mid-Challenge Offer' :
                   '🌟 Special Offer for You',
            description: offer.customMessage || `Special access with ${offer.discountPercentage}% discount`,
            productName: offer.productName || 'Premium Product',
            badge: offer.type === 'completion' ? 'COMPLETION REWARD' : 
                   offer.type === 'mid_challenge' ? 'EXCLUSIVE OFFER' : 'SPECIAL DEAL',
            discount: offer.discountPercentage,
            originalPrice: `$${offer.originalPrice}`,
            discountPrice: `$${discountedPrice}`,
            urgency: `⏰ Limited time offer (${offer.timeLimit || 48} hours)!`,
            ctaText: 'Claim This Offer',
            ctaUrl: offer.checkoutUrl || '#'
          });
        }
      });
    }

    // LEGACY SYSTEM: Process old structure for backward compatibility
    // Challenge Completion Offer
    if (userProgress.isCompleted && monetizationRules.completionOffer) {
      const product = monetizationRules.completionOffer;
      const discountPrice = Math.round(product.originalPrice * (1 - product.discountPercent / 100));
      
      offers.push({
        id: 'completion',
        type: 'completion',
        title: '🎉 Congratulations! Special Completion Offer',
        description: `Vollständiger Zugang zu ${product.productName}`,
        productName: product.productName,
        badge: 'COMPLETION REWARD',
        discount: product.discountPercent,
        originalPrice: `$${product.originalPrice}`,
        discountPrice: `$${discountPrice}`,
        urgency: '⏰ Available for 48 hours only!',
        ctaText: 'Claim Your Reward',
        ctaUrl: product.productUrl
      });
    }

    // High Engagement Offer
    if (userProgress.isHighEngagement && monetizationRules.engagementOffer) {
      const product = monetizationRules.engagementOffer;
      const discountPrice = Math.round(product.originalPrice * (1 - product.discountPercent / 100));
      
      offers.push({
        id: 'engagement',
        type: 'engagement',
        title: '⚡ VIP Offer for Top Performers',
        description: `VIP-Zugang zu ${product.productName}`,
        productName: product.productName,
        badge: 'VIP EXCLUSIVE',
        discount: product.discountPercent,
        originalPrice: `$${product.originalPrice}`,
        discountPrice: `$${discountPrice}`,
        urgency: 'Limited to top 10% of participants',
        ctaText: 'Get VIP Access',
        ctaUrl: product.productUrl
      });
    }

    // Milestone Offers
    monetizationRules.milestoneOffers?.forEach((milestone, index) => {
      // Check if user has reached this milestone
      const milestoneReached = checkMilestoneReached(milestone.milestone, userProgress);
      
      if (milestoneReached) {
        const discountPrice = Math.round(milestone.originalPrice * (1 - milestone.discountPercent / 100));
        
        offers.push({
          id: `milestone-${index}`,
          type: 'milestone',
          title: `🎯 ${milestone.milestone} Milestone Unlocked!`,
          description: `Premium-Zugang zu ${milestone.productName}`,
          productName: milestone.productName,
          badge: 'MILESTONE REWARD',
          discount: milestone.discountPercent,
          originalPrice: `$${milestone.originalPrice}`,
          discountPrice: `$${discountPrice}`,
          urgency: 'Limited time milestone reward',
          ctaText: 'Unlock Milestone Reward',
          ctaUrl: milestone.productUrl
        });
      }
    });

    setAvailableOffers(offers);
  }, [userProgress, monetizationRules]);

  const checkMilestoneReached = (milestone: string, progress: typeof userProgress): boolean => {
    // Enhanced milestone checking logic
    if (milestone.includes('50%') && progress.completionRate >= 50) return true;
    if (milestone.includes('75%') && progress.completionRate >= 75) return true;
    if (milestone.includes('week') && progress.daysSinceStart >= 7) return true;
    if (milestone.includes('streak') && progress.streakCount >= 5) return true;
    
    // High engagement + near completion combination
    if (milestone.includes('premium-target') && 
        progress.completionRate >= 75 && 
        progress.isHighEngagement) {
      return true;
    }
    
    return false;
  };

  const handleOfferClick = (offer: MonetizationOffer) => {
    setSelectedOffer(offer);
    setShowModal(true);
    
    // Track offer click for analytics
    fetch(`/api/analytics/offer-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId,
        userId,
        offerId: offer.id,
        offerType: offer.type
      })
    }).catch(err => console.error('Failed to track offer click:', err));
  };

  const handleOfferClaim = () => {
    if (!selectedOffer) return;
    
    // Track conversion attempt
    fetch(`/api/analytics/offer-conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId,
        userId,
        offerId: selectedOffer.id,
        offerType: selectedOffer.type
      })
    }).catch(err => console.error('Failed to track conversion:', err));

    // Redirect to actual offer (would be Whop product link)
    window.open(selectedOffer.ctaUrl, '_blank');
    setShowModal(false);
  };

  const hasOffers = monetizationRules.offers && monetizationRules.offers.length > 0;
  const isEnabled = monetizationRules.enabled || hasOffers;
  
  if (!isEnabled || availableOffers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Gift className="h-5 w-5" />
        Exclusive Offers for You
      </h3>
      
      <div className="grid gap-4">
        {availableOffers.map((offer) => (
          <Card key={offer.id} className="p-4 border-2 border-brand/20 bg-gradient-to-r from-brand/5 to-transparent">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{offer.title}</h4>
                  {offer.badge && (
                    <Badge className="bg-brand text-black text-xs">{offer.badge}</Badge>
                  )}
                </div>
                
                <div className="text-sm text-brand font-medium mb-1">{offer.productName}</div>
                <p className="text-sm text-muted mb-3">{offer.description}</p>
                
                <div className="flex items-center gap-4 mb-3">
                  {offer.discount && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-brand">{offer.discountPrice}</span>
                      {offer.originalPrice && (
                        <span className="text-sm text-muted line-through">{offer.originalPrice}</span>
                      )}
                      <Badge className="bg-red-500 text-white">{offer.discount}% OFF</Badge>
                    </div>
                  )}
                </div>
                
                {offer.urgency && (
                  <div className="flex items-center gap-1 text-sm text-orange-600 mb-3">
                    <Clock className="h-4 w-4" />
                    {offer.urgency}
                  </div>
                )}
              </div>
              
              <div className="ml-4">
                <Button 
                  className="bg-brand text-black hover:bg-brand/90"
                  onClick={() => handleOfferClick(offer)}
                >
                  {offer.ctaText}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 text-xs text-muted">
                <Star className="h-3 w-3" />
                Based on your performance
              </div>
              <div className="flex items-center gap-1 text-xs text-muted">
                <Zap className="h-3 w-3" />
                Exclusive to challenge participants
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Offer Detail Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        {selectedOffer && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-brand" />
              <h2 className="text-xl font-bold">{selectedOffer.title}</h2>
            </div>
            
            <div className="p-4 bg-brand/10 rounded-lg">
              <div className="text-sm font-medium text-brand mb-1">{selectedOffer.productName}</div>
              <p className="text-sm mb-3">{selectedOffer.description}</p>
              
              {selectedOffer.discount && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-brand">{selectedOffer.discountPrice}</div>
                    {selectedOffer.originalPrice && (
                      <div className="text-sm text-muted line-through">{selectedOffer.originalPrice}</div>
                    )}
                  </div>
                  <Badge className="bg-red-500 text-white">
                    Save {selectedOffer.discount}%
                  </Badge>
                </div>
              )}
            </div>
            
            {selectedOffer.urgency && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{selectedOffer.urgency}</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button 
                className="bg-brand text-black hover:bg-brand/90 flex-1"
                onClick={handleOfferClaim}
              >
                {selectedOffer.ctaText}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
