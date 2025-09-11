"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  price: string;
  productId: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '€29',
    productId: 'prod_YByUE3J5oT4Fq',
    features: [
      'Create unlimited challenges',
      'Basic analytics',
      'Community management',
      'Email support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€99',
    productId: 'prod_Tj4T1U7pVwtgb',
    features: [
      'Everything in Basic',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Priority support',
      'Advanced automations'
    ],
    popular: true
  }
];

export default function PlanSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>}>
      <PlansContent />
    </Suspense>
  );
}

function PlansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Check if user is coming from app installation
  const isNewInstallation = searchParams?.get('new_install') === 'true';
  const companyId = searchParams?.get('company_id');

  useEffect(() => {
    // Check if user already has access
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      const response = await fetch('/api/auth/access-level');
      const data = await response.json();
      
      // If user already has admin access, redirect to dashboard
      console.log('User access data:', data);
      if (data.accessLevel?.userType === 'admin') {
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error checking access:', error);
    }
  };

  const handlePlanSelect = async (plan: Plan) => {
    if (loading) return;
    
    setLoading(true);
    setSelectedPlan(plan.id);
    
    try {
      console.log('🛒 Creating checkout for plan:', plan.name);
      
      // Create Whop checkout session
      const checkoutResponse = await fetch('/api/whop/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: plan.productId,
          planName: plan.name,
          successUrl: `${window.location.origin}/dashboard?plan_purchased=true`,
          cancelUrl: `${window.location.origin}/plans?cancelled=true`,
          metadata: {
            plan_type: plan.id,
            new_installation: isNewInstallation,
            company_id: companyId
          }
        })
      });

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout');
      }

      const { checkoutUrl } = await checkoutResponse.json();
      
      // Redirect to Whop checkout
      window.location.href = checkoutUrl;
      
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            {isNewInstallation ? 'Welcome to Challenges App!' : 'Choose Your Plan'}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {isNewInstallation 
              ? 'To get started creating challenges for your community, choose a plan below.'
              : 'Upgrade your plan to unlock more features and create engaging challenges.'
            }
          </p>
          {isNewInstallation && (
            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg max-w-md mx-auto">
              <p className="text-blue-200 text-sm">
                🎉 As a company owner, you'll get admin access to create challenges after purchasing any plan.
              </p>
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gray-800 rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'border-purple-500 shadow-purple-500/20 shadow-xl' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-white mb-1">
                  {plan.price}
                  <span className="text-lg text-gray-400">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelect(plan)}
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  plan.popular
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                } ${loading && selectedPlan === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading && selectedPlan === plan.id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Checkout...
                  </div>
                ) : (
                  `Get ${plan.name} Plan`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">What happens after I purchase?</h4>
              <p className="text-gray-300">
                You'll automatically get admin access and can start creating challenges for your community immediately.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-300">
                Yes, you can cancel your subscription at any time through your Whop dashboard.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">What's the difference between plans?</h4>
              <p className="text-gray-300">
                Pro includes advanced analytics, custom branding, and priority support. Basic covers all essential features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}