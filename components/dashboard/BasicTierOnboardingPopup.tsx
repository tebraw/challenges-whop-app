'use client';

import { X, TrendingUp, Users, Megaphone, Gift, DollarSign, Zap, Crown, Rocket } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BasicTierOnboardingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
}

export default function BasicTierOnboardingPopup({ 
  isOpen, 
  onClose, 
  onUpgradeClick 
}: BasicTierOnboardingPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 rounded-2xl sm:rounded-3xl w-[98vw] sm:w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] max-h-[95vh] border border-purple-400/50 shadow-[0_0_50px_rgba(168,85,247,0.4)] animate-pulse-glow overflow-hidden">
        
        {/* Animated Border Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-3xl opacity-20 blur animate-pulse"></div>
        
        <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/80 to-indigo-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 max-h-[95vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-6 sm:right-6 text-gray-400 hover:text-white transition-all duration-300 p-1.5 sm:p-2 hover:bg-white/10 rounded-xl group z-10"
          >
            <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-bold mb-4 sm:mb-6 shadow-lg transform hover:scale-105 transition-all duration-300">
              <Crown size={20} className="sm:w-6 sm:h-6" />
              <span className="hidden sm:inline">UNLOCK UNLIMITED POTENTIAL</span>
              <span className="sm:hidden">UNLOCK POTENTIAL</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text mb-3 sm:mb-4 leading-tight">
              Turn Challenges Into
              <br />
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">REVENUE</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-medium px-2">
              Create Paid Challenges with GROWTH
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Engagement */}
            <div className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="text-center">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mx-auto w-fit mb-3">
                  <TrendingUp className="text-white" size={28} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">+300% Engagement</h3>
                <p className="text-gray-300 text-sm">Transform passive followers into active participants. Challenges create daily touchpoints that keep your community engaged and coming back for more.</p>
              </div>
            </div>

            {/* Discover Page */}
            <div className="group bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-5 border border-green-500/30 hover:border-green-400/60 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="text-center">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mx-auto w-fit mb-3">
                  <Megaphone className="text-white" size={28} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Free Marketing</h3>
                <p className="text-gray-300 text-sm">Your challenges appear on our discover page, attracting qualified prospects to your community. Turn visibility into automatic member acquisition.</p>
              </div>
            </div>

            {/* Smart Targeting */}
            <div className="group bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-sm rounded-2xl p-5 border border-orange-500/30 hover:border-orange-400/60 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="text-center">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mx-auto w-fit mb-3">
                  <Gift className="text-white" size={28} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Smart Offers</h3>
                <p className="text-gray-300 text-sm">Create time-sensitive discount codes that activate when members hit milestones. Convert engagement momentum into immediate revenue.</p>
              </div>
            </div>

            {/* Retention */}
            <div className="group bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl p-5 border border-blue-500/30 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="text-center">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mx-auto w-fit mb-3">
                  <Users className="text-white" size={28} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Higher Retention</h3>
                <p className="text-gray-300 text-sm">Challenge winners become your biggest advocates and highest-value customers. Recognition drives loyalty and repeat purchases.</p>
              </div>
            </div>
          </div>

          {/* ROI Showcase */}
          <div className="bg-gradient-to-r from-yellow-600/30 via-orange-600/30 to-red-600/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-yellow-500/40 mb-6 sm:mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-red-500/10 animate-pulse"></div>
            <div className="relative flex flex-col sm:flex-row items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl sm:rounded-2xl">
                  <DollarSign className="text-black" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl sm:text-2xl">GAME CHANGER</h3>
                  <p className="text-yellow-200 text-base sm:text-lg font-semibold">1 Paid Challenge = Entire Plan Cost Covered</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-3xl sm:text-4xl font-black text-yellow-400">∞</div>
                <div className="text-gray-300 font-medium text-sm sm:text-base">Revenue Potential</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-white font-black text-3xl mb-4">
              Ready to <span className="text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">Unlock Growth?</span>
            </h2>
            
            <div className="flex flex-col gap-4 justify-center items-center">
              <Button
                onClick={onUpgradeClick}
                className="group bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 text-black font-black text-lg sm:text-xl px-8 sm:px-12 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.5)] hover:shadow-[0_0_40px_rgba(251,191,36,0.7)] transition-all duration-300 transform hover:scale-110 border-2 border-yellow-400/50 w-full sm:w-auto"
              >
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <Rocket size={20} className="sm:w-6 sm:h-6 group-hover:animate-bounce" />
                  <span className="hidden sm:inline">UPGRADE TO PROPLUS NOW</span>
                  <span className="sm:hidden">UPGRADE TO PROPLUS</span>
                  <Rocket size={20} className="sm:w-6 sm:h-6 group-hover:animate-bounce" />
                </span>
              </Button>
            </div>
            
            <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4 font-medium text-center">
              7-Day Free Trial • No Risk • Cancel Anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
