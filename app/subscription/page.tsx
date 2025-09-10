'use client';

import { useState, useEffect } from 'react';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';
import type { SubscriptionLimits } from '@/lib/subscription-plans';

interface SubscriptionStatus {
  isActive: boolean;
  plan: any;
  subscription: any;
  limits: SubscriptionLimits;
  planName?: string;
}

export default function SubscriptionPage() {
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

  const handleUpgrade = async (planId: string) => {
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        const { checkoutUrl } = await response.json();
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = subscriptionStatus?.plan;
  const limits = subscriptionStatus?.limits;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600">
          Unlock the full potential of your challenge platform
        </p>
      </div>

      {/* Current Usage */}
      {subscriptionStatus?.isActive && limits && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Current Usage - {currentPlan?.name}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-700 mb-1">Monthly Challenges</p>
              <div className="flex items-center">
                <div className="flex-1 bg-blue-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: limits.challengesLimit === -1 
                        ? '0%' 
                        : `${Math.min((limits.challengesUsed / limits.challengesLimit) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-blue-900">
                  {limits.challengesUsed}/{limits.challengesLimit === -1 ? '∞' : limits.challengesLimit}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-blue-700 mb-1">Participants per Challenge</p>
              <p className="text-lg font-semibold text-blue-900">
                Up to {limits.participantsLimit === -1 ? 'Unlimited' : limits.participantsLimit}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrentPlan = currentPlan?.id === plan.id;
          const isPopular = plan.isPopular;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 ${
                isPopular
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.limits.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrentPlan}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  isCurrentPlan
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isPopular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {isCurrentPlan ? 'Current Plan' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="border-t border-gray-200 pt-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What happens if I exceed my limits?
            </h3>
            <p className="text-gray-600">
              If you reach your monthly challenge limit, you'll need to upgrade to create more challenges. 
              Participant limits are enforced per challenge.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Can I change plans anytime?
            </h3>
            <p className="text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-gray-600">
              We offer a 30-day money-back guarantee for all our plans. Contact support for refund requests.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-gray-600">
              We accept all major credit cards, PayPal, and other payment methods through our secure Whop checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
