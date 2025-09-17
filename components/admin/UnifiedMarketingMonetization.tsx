'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DollarSign, Target, TrendingUp, Trophy, Plus, Zap, AlertCircle } from 'lucide-react';
import WhopPromoForm from './WhopPromoForm_new';

interface WhopProduct {
  id: string;
  name: string;
  title: string;
  visibility?: string;
  price?: number;
  currency?: string;
}

interface ActiveOffer {
  id: string;
  type: 'completion' | 'mid_challenge';
  code: string;
  discount: number;
  discountType: 'percentage' | 'flat_amount';
  productId: string;
  productName: string;
  status: 'active' | 'inactive';
  conversions: number;
  revenue: number;
  createdAt: string;
  expiresAt?: string;
}

interface UnifiedMarketingMonetizationProps {
  challengeId: string;
  challengeData: {
    title: string;
    participants: number;
    status: string;
  };
}

export default function UnifiedMarketingMonetization({ 
  challengeId, 
  challengeData 
}: UnifiedMarketingMonetizationProps) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<WhopProduct[]>([]);
  const [offers, setOffers] = useState<ActiveOffer[]>([]);
  const [showCreateForm, setShowCreateForm] = useState<'completion' | 'mid_challenge' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debug log to confirm component is being called
  console.log('🎯 UnifiedMarketingMonetization rendered for challenge:', challengeId);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [challengeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both products and offers using the unified API
      const response = await fetch(`/api/admin/marketing-monetization?challengeId=${challengeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load marketing data');
      }
      
      const data = await response.json();
      
      setProducts(data.products || []);
      setOffers(data.offers || []);
      
    } catch (err) {
      console.error('Error loading marketing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoSuccess = (promoCode: any) => {
    setSuccessMessage(`Successfully created promo code: ${promoCode.code}`);
    setShowCreateForm(null);
    // Reload data to show new offer
    loadData();
    
    // Clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handlePromoError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const deleteOffer = async (offerId: string) => {
    try {
      const response = await fetch('/api/admin/marketing-monetization', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          offerId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete offer');
      }

      // Remove from local state
      setOffers(offers.filter(offer => offer.id !== offerId));
      setSuccessMessage('Offer deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      console.error('Error deleting offer:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete offer');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Calculate totals
  const totalRevenue = offers.reduce((sum, offer) => sum + offer.revenue, 0);
  const totalConversions = offers.reduce((sum, offer) => sum + offer.conversions, 0);
  
  const completionOffers = offers.filter(offer => offer.type === 'completion');
  const midChallengeOffers = offers.filter(offer => offer.type === 'mid_challenge');

  if (loading) {
    return (
      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🚨 DEBUG: Visible marker that component is rendering */}
      <Card className="p-4 bg-red-900 border-red-600">
        <div className="text-red-100 font-bold text-lg">
          🎯 NEW UNIFIED MARKETING & MONETIZATION SYSTEM
        </div>
        <div className="text-red-200 text-sm">
          Challenge ID: {challengeId} | Participants: {challengeData.participants} | Status: {challengeData.status}
        </div>
      </Card>
      {/* Status Messages */}
      {error && (
        <Card className="p-4 bg-red-900 border-red-700">
          <div className="flex items-center gap-2 text-red-200">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}
      
      {successMessage && (
        <Card className="p-4 bg-green-900 border-green-700">
          <div className="flex items-center gap-2 text-green-200">
            <Zap className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-green-400" />
        <h3 className="text-xl font-semibold text-white">Marketing & Monetization</h3>
        {products.length === 0 && (
          <div className="ml-4 px-3 py-1 bg-yellow-900 border border-yellow-700 rounded-lg">
            <span className="text-yellow-200 text-sm">Whop Integration Required</span>
          </div>
        )}
      </div>

      {/* Monetization Status Overview */}
      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-green-400" />
          <h4 className="text-lg font-medium text-white">Revenue Overview</h4>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-400 font-medium">
              {offers.filter(o => o.status === 'active').length} Active Offers
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="text-gray-400">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {totalConversions}
            </div>
            <div className="text-gray-400">Total Conversions</div>
          </div>
        </div>

        {products.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              Connected to {products.length} Whop product{products.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </Card>

      {/* No Products Warning */}
      {products.length === 0 && (
        <Card className="p-6 bg-yellow-900 border-yellow-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-200" />
            <div>
              <h4 className="font-medium text-yellow-200">Whop Integration Required</h4>
              <p className="text-sm text-yellow-300 mt-1">
                Connect your Whop account and add products to start creating monetization offers for this challenge.
              </p>
              <Button 
                onClick={() => window.open('https://whop.com/dashboard', '_blank')}
                className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Open Whop Dashboard
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Offer Management */}
      {products.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Offers */}
          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-400" />
                <h4 className="text-lg font-medium text-white">Completion Offers</h4>
              </div>
              <Button
                onClick={() => setShowCreateForm('completion')}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!!showCreateForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">
              Reward participants who complete the challenge
            </p>

            {completionOffers.length > 0 ? (
              <div className="space-y-3">
                {completionOffers.map(offer => (
                  <div key={offer.id} className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-green-200">{offer.productName}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-400">-{offer.discount}%</span>
                        <Button
                          onClick={() => deleteOffer(offer.id)}
                          variant="outline"
                          className="px-2 py-1 text-xs border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Code: <span className="font-mono text-green-300">{offer.code}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      ${offer.revenue} • {offer.conversions} conversions
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                No completion offers created yet
              </div>
            )}
          </Card>

          {/* Mid-Challenge Offers */}
          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <h4 className="text-lg font-medium text-white">Mid-Challenge Boosts</h4>
              </div>
              <Button
                onClick={() => setShowCreateForm('mid_challenge')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!!showCreateForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">
              Motivate participants during the challenge
            </p>

            {midChallengeOffers.length > 0 ? (
              <div className="space-y-3">
                {midChallengeOffers.map(offer => (
                  <div key={offer.id} className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-blue-200">{offer.productName}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-400">-{offer.discount}%</span>
                        <Button
                          onClick={() => deleteOffer(offer.id)}
                          variant="outline"
                          className="px-2 py-1 text-xs border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Code: <span className="font-mono text-blue-300">{offer.code}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      ${offer.revenue} • {offer.conversions} conversions
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                No mid-challenge offers created yet
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Create Offer Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Create {showCreateForm === 'completion' ? 'Completion' : 'Mid-Challenge'} Offer
                </h3>
                <Button
                  onClick={() => setShowCreateForm(null)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>

              <WhopPromoForm
                type={showCreateForm}
                products={products}
                challengeId={challengeId}
                participantCount={challengeData.participants}
                onSuccess={handlePromoSuccess}
                onError={handlePromoError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}