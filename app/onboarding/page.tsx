// app/onboarding/page.tsx - Company Owner Onboarding
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';

interface UserStatus {
  isCompanyOwner: boolean;
  hasActiveSubscription: boolean;
  currentPlan?: any;
  needsOnboarding: boolean;
}

export default function OnboardingPage() {
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      // Check if user is company owner and subscription status
      const response = await fetch('/api/auth/onboarding-status');
      if (response.ok) {
        const data = await response.json();
        setUserStatus(data);
        
        // Auto-redirect if onboarding is complete
        if (data.hasActiveSubscription && !data.needsOnboarding) {
          router.push('/admin');
        }
      }
    } catch (error) {
      console.error('Failed to check user status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
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
        // Open checkout in same window for onboarding
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-blue-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!userStatus?.isCompanyOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            Access Denied
          </h1>
          <p className="text-red-600 mb-6">
            This onboarding is only available for company owners who have downloaded the app.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (userStatus.hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-4">
            Welcome Back!
          </h1>
          <p className="text-green-600 mb-6">
            You already have an active subscription. You can access your admin dashboard now.
          </p>
          <button
            onClick={() => router.push('/admin')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🎉 Welcome to Challenges App!
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            You've successfully downloaded our app. Now choose your plan to start creating challenges!
          </p>
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-blue-800 font-medium">
              ⚡ As a company owner, you need an active subscription to access the admin dashboard and create challenges.
            </p>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Choose Your Plan
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isPopular = plan.isPopular;
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-8 ${
                    isPopular
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                        🔥 RECOMMENDED
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600 ml-2 text-xl">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.limits.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 text-lg">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                      isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    🚀 Start with {plan.name}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              Why Choose Our Challenge Platform?
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Easy Setup</h4>
                <p className="text-gray-600">Create challenges in minutes, not hours</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Analytics</h4>
                <p className="text-gray-600">Track engagement and performance</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Results</h4>
                <p className="text-gray-600">Boost engagement and participation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
