'use client';

import { AlertTriangle, Crown, TrendingUp, Users, BarChart3 } from 'lucide-react';

interface UsageStatsProps {
  currentTier: 'Basic' | 'Plus' | 'ProPlus' | 'Pre';
  stats: {
    challengesCreated: number;
    totalParticipants: number;
    totalCheckins: number;
  };
  onUpgrade: () => void;
}

const TIER_LIMITS = {
  Basic: {
    challenges: 1, // 1 challenge lifetime (not per month)
    features: ['Basic analytics', 'Email support', 'Community access']
  },
  Plus: {
    challenges: Infinity,
    features: ['Advanced analytics', 'Priority support', 'Custom branding', 'Member tools']
  },
  Pre: {
    challenges: Infinity,
    features: ['Advanced analytics', 'Priority support', 'Custom branding', 'Member tools']
  },
  ProPlus: {
    challenges: Infinity,
    features: ['Everything in Plus', 'White-label', 'API access', 'Dedicated support', 'Revenue sharing']
  }
};

export default function UsageStats({ currentTier, stats, onUpgrade }: UsageStatsProps) {
  const limits = TIER_LIMITS[currentTier];
  const challengeUsagePercent = limits.challenges === Infinity 
    ? 0 
    : Math.min((stats.challengesCreated / limits.challenges) * 100, 100);
  
  const isNearLimit = challengeUsagePercent > 80;
  const isAtLimit = stats.challengesCreated >= limits.challenges && limits.challenges !== Infinity;

  // Don't show for ProPlus users (they have everything)
  if (currentTier === 'ProPlus') return null;
  
  // Treat 'Pre' same as 'Plus' internally
  const effectiveTier = currentTier === 'Pre' ? 'Plus' : currentTier;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 size={20} />
          Your Plan Usage
        </h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            currentTier === 'Plus' 
              ? 'bg-blue-600/20 text-blue-200 border border-blue-600'
              : 'bg-gray-600/20 text-gray-200 border border-gray-600'
          }`}>
            Current: {currentTier}
          </span>
        </div>
      </div>

      {/* Challenge Usage (Basic tier only) */}
      {currentTier === 'Basic' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Challenges Created</span>
            <span className={`text-sm font-medium ${
              isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-gray-300'
            }`}>
              {stats.challengesCreated} / {limits.challenges}
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
            <div 
              className={`h-2 rounded-full transition-all ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${challengeUsagePercent}%` }}
            />
          </div>

          {isAtLimit && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-600/50 rounded-lg mb-4">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-red-300 font-medium">Challenge limit reached!</span>
                <span className="text-red-400"> Upgrade to create unlimited challenges.</span>
              </div>
            </div>
          )}

          {isNearLimit && !isAtLimit && (
            <div className="flex items-center gap-2 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg mb-4">
              <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-yellow-300 font-medium">Almost at your limit!</span>
                <span className="text-yellow-400"> Consider upgrading soon.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.challengesCreated}</div>
          <div className="text-xs text-gray-400">
            {currentTier === 'Basic' ? `of ${limits.challenges}` : 'Unlimited'}
          </div>
          <div className="text-xs text-gray-400">Challenges</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.totalParticipants}</div>
          <div className="text-xs text-gray-400">Total</div>
          <div className="text-xs text-gray-400">Participants</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.totalCheckins}</div>
          <div className="text-xs text-gray-400">Total</div>
          <div className="text-xs text-gray-400">Check-ins</div>
        </div>
      </div>

      {/* Current Features */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Your Current Features:</h4>
        <div className="grid gap-2">
          {limits.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Benefits */}
      {currentTier === 'Basic' && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-600/30">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-blue-200">Upgrade to Plus</span>
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">$19.90/mo</span>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-gray-300">Unlimited challenges</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 size={14} className="text-green-400" />
              <span className="text-gray-300">Advanced analytics & insights</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-green-400" />
              <span className="text-gray-300">Priority support & member tools</span>
            </div>
          </div>

          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Crown size={16} />
            Upgrade to Plus
          </button>
        </div>
      )}

      {/* Plus to ProPlus upgrade */}
      {currentTier === 'Plus' && (
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-600/30">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={16} className="text-purple-400" />
            <span className="text-sm font-medium text-purple-200">Upgrade to ProPlus</span>
            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">$49.90/mo</span>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Crown size={14} className="text-purple-400" />
              <span className="text-gray-300">White-label solutions</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 size={14} className="text-purple-400" />
              <span className="text-gray-300">Advanced API access</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-purple-400" />
              <span className="text-gray-300">Dedicated account manager</span>
            </div>
          </div>

          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Crown size={16} />
            Upgrade to ProPlus
          </button>
        </div>
      )}
    </div>
  );
}