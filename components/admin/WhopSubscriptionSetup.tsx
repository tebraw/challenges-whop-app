"use client";

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  whopProductId?: string;
  isActive: boolean;
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    features: [
      'Up to 3 active challenges',
      'Basic analytics',
      'Email support',
      '10% revenue share on special offers',
      'Free community integration'
    ],
    isActive: true
  },
  {
    id: 'professional',
    name: 'Professional', 
    price: 49,
    features: [
      'Up to 15 active challenges',
      'Advanced analytics & insights',
      'Priority support',
      '10% revenue share on special offers',
      'Premium features',
      'Custom branding options'
    ],
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
      '10% revenue share on special offers',
      'White-label solution',
      'API access',
      'Custom integrations'
    ],
    isActive: true
  }
];

export default function WhopSubscriptionSetup() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>(SUBSCRIPTION_TIERS);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const createWhopProducts = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      for (const tier of tiers) {
        if (!tier.whopProductId) {
          const response = await fetch('/api/admin/whop/create-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Challenge Platform - ${tier.name}`,
              description: `${tier.name} subscription tier for our challenge platform`,
              price: tier.price,
              currency: 'USD',
              product_type: 'subscription',
              billing_period: 'monthly',
              features: tier.features,
              tier_id: tier.id
            })
          });

          if (!response.ok) throw new Error(`Failed to create ${tier.name} product`);

          const result = await response.json();
          tier.whopProductId = result.product_id;
        }
      }

      setTiers([...tiers]);
      setMessage({ type: 'success', text: 'All Whop products created successfully!' });
    } catch (error) {
      console.error('Error creating Whop products:', error);
      setMessage({ type: 'error', text: 'Failed to create Whop products. Check console for details.' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRevenueSharingSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/whop/revenue-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform_fee_percentage: 10,
          revenue_sharing_enabled: true,
          transparent_disclosure: true,
          payment_terms: 'Monthly payouts on the 15th of each month'
        })
      });

      if (!response.ok) throw new Error('Failed to update revenue settings');

      setMessage({ type: 'success', text: 'Revenue sharing settings updated!' });
    } catch (error) {
      console.error('Error updating revenue settings:', error);
      setMessage({ type: 'error', text: 'Failed to update revenue settings' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Whop Integration Setup
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure subscription tiers and revenue sharing for your challenge platform
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

      {/* Subscription Tiers Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Subscription Tiers
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
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
              
              <ul className="space-y-2 mb-4">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                {tier.whopProductId ? (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✓ Whop Product Created
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Pending Whop Setup
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

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

      {/* Setup Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Setup Actions
        </h2>
        <div className="space-y-4">
          <Button
            onClick={createWhopProducts}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating Whop Products...' : 'Create Whop Products'}
          </Button>

          <Button
            onClick={updateRevenueSharingSettings}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Updating Settings...' : 'Configure Revenue Sharing'}
          </Button>
        </div>
      </Card>

      {/* Integration Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Integration Status
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium">Whop API Connection</span>
            <span className="text-green-600 dark:text-green-400">✓ Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium">Subscription Products</span>
            <span className={`${tiers.every(t => t.whopProductId) ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {tiers.filter(t => t.whopProductId).length}/{tiers.length} Created
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium">Revenue Sharing</span>
            <span className="text-green-600 dark:text-green-400">✓ 10% Model Active</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
