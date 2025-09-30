"use client";

import { useState, useEffect } from 'react';
import { useIframeSdk } from "@whop/react";
import { Card } from '../ui/Card';
import Button from '../ui/Button';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  whopProdId: string; // Plan ID statt Product ID für inAppPurchase
  isActive: boolean;
}

// ❌ BASIC PLAN REMOVED: Users get Basic access by default (no purchase needed)
const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'professional',
    name: 'Professional', 
    price: 49,
    features: [
      'Up to 15 active challenges',
      'Advanced analytics & insights',
      'Priority support',
      '10% revenue share on entry fees',
      'Premium features',
      'Custom branding options'
    ],
    whopProdId: 'plan_HIkvcR8fdipgO', // Pre Plan ID aus .env.local (Whop plan is named "Pre")
    isActive: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 79,
    features: [
      'Unlimited challenges',
      'Full analytics suite',
      'Dedicated support manager',
      '10% revenue share on entry fees',
      'White-label solution',
      'API access',
      'Custom integrations'
    ],
    whopProdId: 'plan_SHRCynR9h3EdG', // ProPlus Plan ID aus .env.local
    isActive: true
  }
];

export default function WhopSubscriptionSetup() {
  const iframeSdk = useIframeSdk();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentTier, setCurrentTier] = useState<string>('');
  const [receiptId, setReceiptId] = useState<string>();

  useEffect(() => {
    // Get current subscription tier from API
    fetchCurrentTier();
  }, []);

  const fetchCurrentTier = async () => {
    try {
      const response = await fetch('/api/admin/access-tier');
      const data = await response.json();
      setCurrentTier(data.tier || '');
    } catch (error) {
      console.error('Error fetching current tier:', error);
    }
  };

  const handleSubscriptionPurchase = async (tier: SubscriptionTier) => {
    if (!iframeSdk) {
      setMessage({ type: 'error', text: 'Whop SDK not available' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      // Use Whop In-App Purchase API
      const res = await iframeSdk.inAppPurchase({ 
        planId: tier.whopProdId 
      });
      
      if (res.status === "ok") {
        setReceiptId(res.data.receiptId);
        setMessage({ 
          type: 'success', 
          text: `Successfully subscribed to ${tier.name} plan! Receipt ID: ${res.data.receiptId}` 
        });
        
        // Refresh current tier after successful purchase
        setTimeout(() => {
          fetchCurrentTier();
        }, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          text: res.error || `Failed to subscribe to ${tier.name} plan` 
        });
      }
    } catch (error) {
      console.error("Subscription purchase failed:", error);
      setMessage({ 
        type: 'error', 
        text: `Subscription purchase failed: ${error}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentTier = (tierId: string) => {
    const tierMapping: Record<string, string> = {
      'Basic': 'starter',
      'Plus': 'professional', 
      'ProPlus': 'enterprise'
    };
    return tierMapping[currentTier] === tierId;
  };

  const handleManageSubscription = async () => {
    if (!iframeSdk) return;

    try {
      // Open Whop subscription management page
      await iframeSdk.openExternalUrl({
        url: "https://whop.com/hub/subscriptions"
      });
    } catch (error) {
      console.error('Error opening subscription management:', error);
    }
  };



  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Subscription Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upgrade your challenge platform subscription
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {receiptId && (
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
          <p className="text-green-800 dark:text-green-200">
            ✅ Purchase completed! Receipt ID: <code className="font-mono text-sm">{receiptId}</code>
          </p>
        </Card>
      )}

      {/* Current Subscription Status */}
      {currentTier && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Current Plan: {currentTier}
              </h2>
              <p className="text-blue-800 dark:text-blue-300">
                {currentTier === 'Basic' && '$19/month'}
                {currentTier === 'Plus' && '$49/month'}
                {currentTier === 'ProPlus' && '$79/month'}
              </p>
            </div>
            <Button
              onClick={handleManageSubscription}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Manage Subscription
            </Button>
          </div>
        </Card>
      )}

      {/* Subscription Tiers */}
      <div className="grid gap-6 md:grid-cols-3">
        {SUBSCRIPTION_TIERS.map((tier) => (
          <Card key={tier.id} className="p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {tier.name}
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${tier.price}
                </span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
            </div>
            
            <ul className="space-y-2 mb-6">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSubscriptionPurchase(tier)}
              disabled={isLoading || isCurrentTier(tier.id) || !iframeSdk}
              className="w-full"
              variant={isCurrentTier(tier.id) ? 'outline' : 'primary'}
            >
              {isCurrentTier(tier.id) ? 'Current Plan' : 
               isLoading ? 'Processing...' : 
               !iframeSdk ? 'SDK Loading...' :
               `Subscribe to ${tier.name}`}
            </Button>

            {/* Plan ID Display for debugging */}
            <div className="mt-2 text-xs text-gray-500 text-center">
              Plan ID: {tier.whopProdId}
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Sharing Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Revenue Sharing Model
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
            10% Platform Fee Structure
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Creators keep 90% of all special offer sales</li>
            <li>• Platform takes 10% transaction fee</li>
            <li>• Transparent disclosure to all creators</li>
            <li>• Monthly payouts on the 15th of each month</li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-medium text-green-900 dark:text-green-200 mb-2">
            Example Revenue Calculation
          </h3>
          <div className="text-sm text-green-800 dark:text-green-300">
            <p>Creator Special Offer Sale: $100</p>
            <p>Creator receives: $90 (90%)</p>
            <p>Platform fee: $10 (10%)</p>
          </div>
        </div>
      </Card>



      {/* Integration Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Integration Status
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium">Whop iFrame SDK</span>
            <span className={`${iframeSdk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {iframeSdk ? '✓ Connected' : '✗ Not Available'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium">Subscription Plans</span>
            <span className="text-green-600 dark:text-green-400">
              ✓ {SUBSCRIPTION_TIERS.length}/3 Plans Configured
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium">Revenue Sharing</span>
            <span className="text-green-600 dark:text-green-400">✓ 10% Model Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium">Current Tier Detection</span>
            <span className={`${currentTier ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {currentTier ? `✓ ${currentTier} Detected` : '⚠ Detecting...'}
            </span>
          </div>
          {receiptId && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium">Last Purchase</span>
              <span className="text-green-600 dark:text-green-400 font-mono text-xs">
                {receiptId}
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
