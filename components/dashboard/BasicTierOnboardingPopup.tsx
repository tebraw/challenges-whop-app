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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 rounded-3xl max-w-6xl w-full border border-purple-400/50 shadow-[0_0_50px_rgba(168,85,247,0.4)] animate-pulse-glow">
        
        {/* Animated Border Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-3xl opacity-20 blur animate-pulse"></div>
        
        <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/80 to-indigo-900 rounded-3xl p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all duration-300 p-2 hover:bg-white/10 rounded-xl group"
          >
            <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-3 rounded-full text-lg font-bold mb-6 shadow-lg transform hover:scale-105 transition-all duration-300">
              <Crown size={24} />
              UNLOCK UNLIMITED POTENTIAL
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text mb-4 leading-tight">
              Turn Challenges Into
              <br />
              <span className="text-6xl md:text-7xl">REVENUE</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto font-medium">
              Create Paid Challenges with GROWTH
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {/* Engagement */}
            <div className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-5 border border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-105 hover:shadow-lg">
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
          <div className="bg-gradient-to-r from-yellow-600/30 via-orange-600/30 to-red-600/30 rounded-2xl p-6 border border-yellow-500/40 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-red-500/10 animate-pulse"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl">
                  <DollarSign className="text-black" size={32} />
                </div>
                <div>
                  <h3 className="text-white font-black text-2xl">GAME CHANGER</h3>
                  <p className="text-yellow-200 text-lg font-semibold">1 Paid Challenge = Entire Plan Cost Covered</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-yellow-400">∞</div>
                <div className="text-gray-300 font-medium">Revenue Potential</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-white font-black text-3xl mb-4">
              Ready to <span className="text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">Unlock Growth?</span>
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={onUpgradeClick}
                className="group bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 text-black font-black text-xl px-12 py-4 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.5)] hover:shadow-[0_0_40px_rgba(251,191,36,0.7)] transition-all duration-300 transform hover:scale-110 border-2 border-yellow-400/50"
              >
                <span className="flex items-center gap-3">
                  <Rocket size={24} className="group-hover:animate-bounce" />
                  UPGRADE TO PROPLUS NOW
                  <Rocket size={24} className="group-hover:animate-bounce" />
                </span>
              </Button>
            </div>
            
            <p className="text-gray-400 text-sm mt-4 font-medium">
              7-Day Free Trial • No Risk • Cancel Anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}