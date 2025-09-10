'use client';

import { useState, useEffect } from 'react';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';
import type { SubscriptionLimits } from '@/lib/subscription-plans';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  action: 'create_challenge' | 'add_participants';
  currentParticipantCount?: number;
  fallback?: React.ReactNode;
}

interface SubscriptionStatus {
  isActive: boolean;
  limits: SubscriptionLimits;
  planName?: string;
}

export function SubscriptionGuard({ 
  children, 
  action, 
  currentParticipantCount = 0,
  fallback 
}: SubscriptionGuardProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscriptionStatus() {
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
    }

    fetchSubscriptionStatus();
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded h-8"></div>;
  }

  if (!subscriptionStatus) {
    return fallback || <UpgradePrompt action={action} />;
  }

  const { isActive, limits } = subscriptionStatus;

  // Check permissions based on action
  if (action === 'create_challenge' && !limits.canCreateChallenge) {
    return fallback || <UpgradePrompt action={action} limits={limits} />;
  }

  if (action === 'add_participants' && !limits.canAddParticipants(currentParticipantCount)) {
    return fallback || <UpgradePrompt action={action} limits={limits} currentParticipantCount={currentParticipantCount} />;
  }

  return <>{children}</>;
}

interface UpgradePromptProps {
  action: 'create_challenge' | 'add_participants';
  limits?: SubscriptionLimits;
  currentParticipantCount?: number;
}

function UpgradePrompt({ action, limits, currentParticipantCount }: UpgradePromptProps) {
  const getMessage = () => {
    if (action === 'create_challenge') {
      if (limits?.challengesLimit === 0) {
        return 'You need an active subscription to create challenges.';
      }
      return `You've reached your monthly limit of ${limits?.challengesLimit} challenges. Upgrade to create more!`;
    }
    
    if (action === 'add_participants') {
      return `This challenge has reached the participant limit of ${limits?.participantsLimit}. Upgrade to allow more participants!`;
    }
    
    return 'Upgrade your subscription to access this feature.';
  };

  const handleUpgrade = () => {
    // Redirect to subscription page
    window.location.href = '/subscription';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center">
      <div className="text-blue-600 mb-2">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade Required</h3>
      <p className="text-gray-600 mb-4">{getMessage()}</p>
      <div className="space-y-2">
        <button
          onClick={handleUpgrade}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Upgrade Now
        </button>
        <p className="text-sm text-gray-500">
          Starting from ${SUBSCRIPTION_PLANS[0].price}/month
        </p>
      </div>
    </div>
  );
}

export default SubscriptionGuard;
