'use client';

import { useState } from 'react';
import { X, TrendingUp, Users, Megaphone, Gift, DollarSign, Zap } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl">
        {/* Close Button */}
        <div className="flex justify-end p-6 pb-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Header */}
        <div className="px-8 pb-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Zap size={16} />
              UNLOCK YOUR COMMUNITY'S POTENTIAL
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Turn Your Community Into A 
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {" "}Revenue Machine
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Wöchentliche Challenges sind der Schlüssel zu explosivem Community-Wachstum und nachhaltigen Einnahmen
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Community Engagement */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Community Engagement Explosion
                  </h3>
                  <p className="text-gray-300">
                    Regelmäßige Challenges steigern das Engagement um durchschnittlich <span className="text-purple-400 font-bold">300%</span>. 
                    Deine Member werden süchtig nach den nächsten Herausforderungen.
                  </p>
                </div>
              </div>
            </div>

            {/* Member Motivation */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Users className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Motiviere zu Höchstleistungen
                  </h3>
                  <p className="text-gray-300">
                    Gamification durch Challenges motiviert Member zu kontinuierlichen Verbesserungen. 
                    <span className="text-blue-400 font-bold"> Top-Performer bleiben länger</span> und kaufen mehr.
                  </p>
                </div>
              </div>
            </div>

            {/* Discover Page Marketing */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-600 rounded-lg">
                  <Megaphone className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Kostenlose Werbung für deine Community
                  </h3>
                  <p className="text-gray-300">
                    Deine Challenges erscheinen in der <span className="text-green-400 font-bold">Discover Page</span> - 
                    auch für Nicht-Member sichtbar. Perfekte Akquise neuer Kunden!
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Marketing */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-600 rounded-lg">
                  <Gift className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Smart Notification Marketing
                  </h3>
                  <p className="text-gray-300">
                    Sende während Challenges gezielte <span className="text-orange-400 font-bold">Promo Codes & Produktangebote</span>. 
                    Nutze den Momentum für maximale Conversions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Highlight */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-red-500/20 rounded-xl p-6 border border-yellow-500/30 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-yellow-600 rounded-lg">
                <DollarSign className="text-white" size={28} />
              </div>
              <div>
                <h3 className="text-white font-bold text-2xl">
                  ROI Game-Changer: Paid Challenges
                </h3>
                <p className="text-yellow-200 text-lg">
                  Nur für ProPlus verfügbar - aber es lohnt sich!
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-200 mb-2">
                  <span className="text-yellow-400 font-bold">Eine einzige Paid Challenge pro Monat</span> kann bereits 
                  die kompletten Kosten deines ProPlus Plans decken.
                </p>
                <p className="text-gray-300">
                  Top-motivierte Member zahlen gerne für exklusive Herausforderungen mit wertvollen Preisen.
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-yellow-400 font-bold text-2xl">1 Paid Challenge</div>
                  <div className="text-gray-300 text-sm mb-2">pro Monat</div>
                  <div className="text-green-400 font-bold text-lg">= ProPlus bezahlt sich selbst</div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-white font-bold text-2xl mb-4">
              Bereit, deine Community auf das nächste Level zu bringen?
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Mit ProPlus verwandelst du Challenges von einem netten Feature in deine 
              <span className="text-purple-400 font-bold"> profitabelste Marketing-Strategie</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={onUpgradeClick}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                🚀 Upgrade zu ProPlus - Jetzt starten!
              </Button>
              <div className="text-gray-400 text-sm">
                30 Tage Geld-zurück-Garantie
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}