'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SubscriptionLimits } from '@/lib/subscription-plans';

interface SubscriptionStatus {
  isActive: boolean;
  plan: any;
  limits: SubscriptionLimits;
  planName?: string;
}

export function UsageWidget() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscriptionStatus) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          No Active Subscription
        </h3>
        <p className="text-red-700 mb-4">
          You need an active subscription to create challenges.
        </p>
        <Link
          href="/subscription"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Choose a Plan
        </Link>
      </div>
    );
  }

  const { limits, plan } = subscriptionStatus;
  const challengeUsagePercent = limits.challengesLimit === -1 
    ? 0 
    : Math.min((limits.challengesUsed / limits.challengesLimit) * 100, 100);

  const isNearLimit = challengeUsagePercent > 80;
  const isAtLimit = !limits.canCreateChallenge;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Subscription Usage
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          subscriptionStatus.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {plan?.name || 'No Plan'}
        </span>
      </div>

      {/* Challenge Usage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Monthly Challenges
          </span>
          <span className="text-sm text-gray-600">
            {limits.challengesUsed}/{limits.challengesLimit === -1 ? '∞' : limits.challengesLimit}
          </span>
        </div>
        
        {limits.challengesLimit !== -1 && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isAtLimit ? 'bg-red-500' : 
                isNearLimit ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${challengeUsagePercent}%` }}
            ></div>
          </div>
        )}

        {isAtLimit && (
          <p className="text-sm text-red-600 font-medium">
            Monthly limit reached
          </p>
        )}
        {isNearLimit && !isAtLimit && (
          <p className="text-sm text-yellow-600 font-medium">
            Approaching monthly limit
          </p>
        )}
      </div>

      {/* Participant Limit */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Participants per Challenge
          </span>
          <span className="text-sm text-gray-600">
            Up to {limits.participantsLimit === -1 ? 'Unlimited' : limits.participantsLimit}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {(isAtLimit || isNearLimit) && (
          <Link
            href="/subscription"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Upgrade Plan
          </Link>
        )}
        
        <Link
          href="/subscription"
          className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-center px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Manage Subscription
        </Link>
      </div>
    </div>
  );
}

export default UsageWidget;
