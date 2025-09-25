'use client';

import { useState } from 'react';
import { Sparkles, Users, BarChart3, Crown, ArrowRight, X } from 'lucide-react';

interface NewInstallerWelcomeProps {
  isVisible: boolean;
  onDismiss: () => void;
  onUpgrade: () => void;
  currentTier: 'Basic' | 'Plus' | 'ProPlus';
  stats: {
    challengesCreated: number;
    totalParticipants: number;
    totalCheckins: number;
  };
}

export default function NewInstallerWelcome({ 
  isVisible, 
  onDismiss, 
  onUpgrade, 
  currentTier, 
  stats 
}: NewInstallerWelcomeProps) {
  if (!isVisible || currentTier !== 'Basic') return null;

  const isNewUser = stats.challengesCreated === 0;

  return (
    <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl border border-blue-600/30 p-6 mb-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 text-6xl">🚀</div>
        <div className="absolute bottom-4 left-4 text-4xl">⭐</div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5">🎯</div>
      </div>

      {/* Close Button */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
      >
        <X size={20} />
      </button>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isNewUser ? 'Welcome to Challenge Dashboard!' : 'Unlock Your Full Potential'}
            </h2>
            <p className="text-blue-200 text-sm">
              {isNewUser 
                ? 'Start building your community with powerful challenge features'
                : 'You\'re doing great! Ready to take it to the next level?'
              }
            </p>
          </div>
        </div>

        {/* Current Stats (if user has some activity) */}
        {!isNewUser && (
          <div className="grid grid-cols-3 gap-4 mb-6 bg-black/20 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.challengesCreated}</div>
              <div className="text-xs text-gray-300">Challenges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.totalParticipants}</div>
              <div className="text-xs text-gray-300">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.totalCheckins}</div>
              <div className="text-xs text-gray-300">Check-ins</div>
            </div>
          </div>
        )}

        {/* Plan Comparison */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Basic (Current) */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-300">Basic (Current)</span>
            </div>
            <div className="text-lg font-bold text-white mb-3">FREE</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Up to 3 challenges</li>
              <li>• Basic analytics</li>
              <li>• Community access</li>
              <li>• Email support</li>
            </ul>
          </div>

          {/* Plus (Recommended) */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/20 rounded-lg p-4 border-2 border-blue-500 relative">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                RECOMMENDED
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm font-medium text-blue-200">Plus</span>
            </div>
            <div className="text-lg font-bold text-white mb-3">$19.90<span className="text-sm text-gray-300">/mo</span></div>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>• Unlimited challenges</li>
              <li>• Advanced analytics</li>
              <li>• Priority support</li>
              <li>• Custom branding</li>
              <li>• Member engagement tools</li>
            </ul>
          </div>

          {/* ProPlus */}
          <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-200">ProPlus</span>
            </div>
            <div className="text-lg font-bold text-white mb-3">$49.90<span className="text-sm text-gray-300">/mo</span></div>
            <ul className="space-y-2 text-sm text-purple-200">
              <li>• Everything in Plus</li>
              <li>• White-label solutions</li>
              <li>• Advanced API access</li>
              <li>• Dedicated support</li>
              <li>• Revenue sharing</li>
            </ul>
          </div>
        </div>

        {/* Why Upgrade */}
        <div className="bg-black/20 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart3 size={16} />
            Why upgrade to Plus?
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <ArrowRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">
                <strong className="text-white">Unlimited challenges</strong> - Create as many as you want
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">
                <strong className="text-white">Advanced analytics</strong> - Deep insights into engagement
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">
                <strong className="text-white">Custom branding</strong> - Make it yours with personalization
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">
                <strong className="text-white">Member tools</strong> - Advanced engagement features
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onUpgrade}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            {isNewUser ? 'Start with Plus Plan' : 'Upgrade to Plus'}
            <ArrowRight size={16} />
          </button>
          <button
            onClick={onDismiss}
            className="sm:w-auto bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {isNewUser ? 'Continue with Basic' : 'Maybe Later'}
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="flex justify-center items-center gap-4 mt-4 text-xs text-gray-400">
          <span>✨ Cancel anytime</span>
          <span>🔒 Secure payments</span>
          <span>📧 Email support included</span>
        </div>
      </div>
    </div>
  );
}