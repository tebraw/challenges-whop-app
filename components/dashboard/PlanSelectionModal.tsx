'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: 'Basic' | 'Plus' | 'ProPlus' | null;
  onPlanSelect: (planId: string, tierName: string) => void;
}

// KORREKTE WHOP PLAN IDS - diese müssen in Whop Dashboard eingerichtet werden
// ❌ BASIC PLAN REMOVED: Users get Basic access by default (no purchase needed)
const PLANS = [
  {
    id: process.env.NEXT_PUBLIC_PLUS_PLAN_ID || 'plan_plus_placeholder',
    accessPassId: process.env.NEXT_PUBLIC_PLUS_ACCESS_PASS_ID || 'pass_plus_placeholder',
    name: 'Plus',
    price: '$19.90',
    priceDetail: '/month',
    description: 'Ideal for growing communities',
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-900',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    popular: true,
    features: [
      '✅ Unlimited challenges',
      '❌ Paid challenges',
      '✅ Priority email support'
    ]
  },
  {
    id: process.env.NEXT_PUBLIC_PROPLUS_PLAN_ID || 'plan_proplus_placeholder',
    accessPassId: process.env.NEXT_PUBLIC_PROPLUS_ACCESS_PASS_ID || 'pass_proplus_placeholder',
    name: 'ProPlus',
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

  const getButtonText = (planName: string) => {
    if (currentTier === planName) return 'Current Plan';
    if (planName === 'Basic') return 'Downgrade to Basic';
    return `Upgrade to ${planName}`;
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
              {currentTier === 'Plus' && ' ($19.90/month)'}
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
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

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
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
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
                    onClick={() => handlePlanSelect(plan.id, plan.name)}
                    disabled={isCurrentPlan(plan.name) || isProcessing}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isCurrentPlan(plan.name)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : `${plan.buttonColor} text-white ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`
                    }`}
                  >
                    {isProcessing ? 'Processing...' : getButtonText(plan.name)}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Need Help Choosing?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Start with <strong>Basic</strong> to explore our features. Upgrade to <strong>Plus</strong> when you need unlimited challenges and advanced analytics. 
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