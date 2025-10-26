'use client';

import { useState } from 'react';
import { X, Check, Tag } from 'lucide-react';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: 'Basic' | 'Pre' | 'ProPlus' | null;
  onPlanSelect: (planId: string, tierName: string) => void;
}

// KORREKTE WHOP PLAN IDS - diese müssen in Whop Dashboard eingerichtet werden
// ❌ BASIC PLAN REMOVED: Users get Basic access by default (no purchase needed)

// DEBUG: Log Plan IDs to console with detailed info
console.log('🔍 Pre Plan ID from env:', process.env.NEXT_PUBLIC_PRE_PLAN_ID);
console.log('🔍 ProPlus Plan ID from env:', process.env.NEXT_PUBLIC_PROPLUS_PLAN_ID);
console.log('🔍 ALL ENV VARS DEBUG:', {
  PRE_PLAN_ID: process.env.NEXT_PUBLIC_PRE_PLAN_ID,
  PRE_ACCESS_PASS_ID: process.env.NEXT_PUBLIC_PRE_ACCESS_PASS_ID,
  PROPLUS_PLAN_ID: process.env.NEXT_PUBLIC_PROPLUS_PLAN_ID,
  PROPLUS_ACCESS_PASS_ID: process.env.NEXT_PUBLIC_PROPLUS_ACCESS_PASS_ID
});

// ADDITIONAL DEBUG: Check values before PLANS array creation
console.log('🔥 DIRECT ENV CHECK before PLANS array:', {
  PRE_ID: process.env.NEXT_PUBLIC_PRE_PLAN_ID,
  PRE_DEFAULT: 'plan_pre_placeholder',
  RESULT: process.env.NEXT_PUBLIC_PRE_PLAN_ID || 'plan_pre_placeholder'
});

const PLANS = [
  {
    id: process.env.NEXT_PUBLIC_PRE_PLAN_ID || 'plan_HIkvcR8fdipgO', // HARDCODED FALLBACK
    accessPassId: process.env.NEXT_PUBLIC_PRE_ACCESS_PASS_ID || 'prod_ttlhdSPEzAXeO', // HARDCODED FALLBACK
    name: 'Pre', // Internal name matching Whop plan
    displayName: 'Pre', // User-facing name (unified with internal name)
    price: '$19.90',
    priceDetail: '/month',
    description: 'Ideal for growing communities',
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-900',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    // popular: true, // DISABLED: Could interfere with click events
    features: [
      '✅ Unlimited challenges',
      '❌ Paid challenges',
      '✅ Priority email support'
    ]
  },
  {
    id: process.env.NEXT_PUBLIC_PROPLUS_PLAN_ID || 'plan_SHRCynR9h3EdG', // HARDCODED FALLBACK
    accessPassId: process.env.NEXT_PUBLIC_PROPLUS_ACCESS_PASS_ID || 'prod_9YkNJGjxSgRyE', // HARDCODED FALLBACK
    name: 'ProPlus', // Internal name matching Whop plan
    displayName: 'ProPlus', // User-facing name
    price: '$49.90',
    priceDetail: '/month',
    description: 'Maximum power for enterprises',
    color: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-900',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    features: [
      '✅ Unlimited challenges',
      '✅ Paid challenges',
      '✅ Priority email support'
    ]
  }
];

export default function PlanSelectionModal({ isOpen, onClose, currentTier, onPlanSelect }: PlanSelectionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  if (!isOpen) return null;

  const handlePlanSelect = async (planId: string, tierName: string) => {
    if (isProcessing || currentTier === tierName) return;
    
    setIsProcessing(true);
    try {
      await onPlanSelect(planId, tierName);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePromoCodeSubmit = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsProcessing(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      const response = await fetch('/api/promo/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setPromoError(data.error || 'Invalid promo code');
        setIsProcessing(false);
        return;
      }

      // Success!
      setPromoSuccess(`🎉 ${data.tier} access activated!`);
      setPromoCode('');
      
      // Refresh page after 1.5 seconds to show new tier
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Promo code error:', error);
      setPromoError('Failed to activate promo code');
      setIsProcessing(false);
    }
  };

  const getButtonText = (planName: string, displayName: string) => {
    if (currentTier === planName) return 'Current Plan';
    if (planName === 'Basic') return 'Downgrade to Basic';
    return `Upgrade to ${displayName}`;
  };

  const isCurrentPlan = (planName: string) => currentTier === planName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="text-gray-600 mt-1">Select the perfect plan for your community needs</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Current Plan Indicator */}
        {currentTier && (
          <div className="px-6 py-3 bg-blue-50 border-b">
            <p className="text-sm text-blue-800">
              <strong>Current Plan:</strong> {currentTier} 
              {currentTier === 'Basic' && ' (FREE)'}
              {currentTier === 'Pre' && ' ($19.90/month)'}
              {currentTier === 'ProPlus' && ' ($49.90/month)'}
            </p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 p-6 ${plan.color} ${
                  isCurrentPlan(plan.name) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Current Plan Badge */}
                {isCurrentPlan(plan.name) && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Check size={12} />
                      Current
                    </span>
                  </div>
                )}

                <div className={`${plan.textColor}`}>
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.displayName}</h3>
                    <div className="mb-3">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.priceDetail && (
                        <span className="text-lg opacity-70">{plan.priceDetail}</span>
                      )}
                    </div>
                    <p className="text-sm opacity-80">{plan.description}</p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      console.log(`🔍 [DEBUG] Button clicked for plan: ${plan.name}, id: ${plan.id}`);
                      console.log(`🔍 [DEBUG] isCurrentPlan(${plan.name}):`, isCurrentPlan(plan.name));
                      console.log(`🔍 [DEBUG] currentTier:`, currentTier);
                      console.log(`🔍 [DEBUG] isProcessing:`, isProcessing);
                      console.log(`🔍 [DEBUG] button disabled:`, isCurrentPlan(plan.name) || isProcessing);
                      handlePlanSelect(plan.id, plan.name);
                    }}
                    disabled={isCurrentPlan(plan.name) || isProcessing}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isCurrentPlan(plan.name)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : `${plan.buttonColor} text-white ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`
                    }`}
                  >
                    {isProcessing ? 'Processing...' : getButtonText(plan.name, plan.displayName)}
                  </button>
                </div>
              </div>
            ))}

            {/* 🎟️ PROMO CODE CARD */}
            <div className="relative rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-6">
              <div className="text-green-900">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-green-200 rounded-full">
                      <Tag size={24} className="text-green-700" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Promo Code</h3>
                  <p className="text-sm opacity-80">Have a beta access code?</p>
                </div>

                {!showPromoInput ? (
                  <button
                    onClick={() => setShowPromoInput(true)}
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Enter Promo Code
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError('');
                        setPromoSuccess('');
                      }}
                      placeholder="BETA-XXXX-XXXX-XXXX"
                      className="w-full px-4 py-2 border-2 border-green-300 rounded-lg text-center font-mono font-bold text-green-900 placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      maxLength={19}
                      disabled={isProcessing}
                    />
                    
                    {promoError && (
                      <p className="text-xs text-red-600 text-center">{promoError}</p>
                    )}
                    
                    {promoSuccess && (
                      <p className="text-xs text-green-700 font-bold text-center">{promoSuccess}</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowPromoInput(false);
                          setPromoCode('');
                          setPromoError('');
                          setPromoSuccess('');
                        }}
                        disabled={isProcessing}
                        className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePromoCodeSubmit}
                        disabled={isProcessing || !promoCode.trim()}
                        className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Activating...' : 'Activate'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-green-200">
                  <p className="text-xs text-center opacity-70">
                    Beta testers: Use your exclusive code for ProPlus access
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Need Help Choosing?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Start with <strong>Basic</strong> to explore our features. Upgrade to <strong>Pre</strong> when you need unlimited challenges and advanced analytics. 
              Choose <strong>ProPlus</strong> for enterprise features and dedicated support.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>✨ Cancel anytime</span>
              <span>🔒 Secure payments via Whop</span>
              <span>📧 Email support included</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}