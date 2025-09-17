"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import {
  ShoppingBag,
  Target,
  TrendingUp,
  DollarSign,
  Check,
  Settings,
  Trash2,
  Edit
} from "lucide-react";

interface MonetizationDashboardProps {
  challengeId: string;
  challengeData: {
    title: string;
    participants: number;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ActiveOffer {
  id?: string;
  type: "completion" | "mid_challenge";
  product: Product;
  discount: number;
  status: "active";
  conversions: number;
  revenue: number;
}

export default function MonetizationDashboard({ challengeId, challengeData }: MonetizationDashboardProps) {
  const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const [completionSetup, setCompletionSetup] = useState({
    product: "",
    discount: 15
  });

  const [midChallengeSetup, setMidChallengeSetup] = useState({
    product: "",
    discount: 25
  });

  // Load existing offers and products on component mount
  useEffect(() => {
    loadOffers();
    loadWhopProducts();
  }, [challengeId]);

  const loadOffers = async () => {
    try {
      const response = await fetch(`/api/admin/challenge-offers?challengeId=${challengeId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.offers && Array.isArray(data.offers)) {
          // Transform API data to ActiveOffer format
          const transformedOffers = data.offers.map((offer: any) => ({
            id: offer.id,
            type: offer.type,
            product: {
              id: offer.productId || "1",
              name: offer.productName || "Premium Training Plan",
              price: offer.originalPrice || 97
            },
            discount: offer.discountPercentage || 15,
            status: offer.status || "active",
            conversions: offer.conversions || 0,
            revenue: offer.revenue || 0
          }));
          setActiveOffers(transformedOffers);
        }
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWhopProducts = async () => {
    try {
      const response = await fetch(`/api/admin/marketing-monetization?challengeId=${challengeId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Whop products loaded:', data);
        
        // Transform Whop products to the format expected by MonetizationDashboard
        const whopProducts = (data.products || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          price: product.price
        }));
        
        setProducts(whopProducts);
      } else {
        console.error('Failed to load Whop products:', response.status);
        // Still show UI but with empty product list
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading Whop products:', error);
      // Still show UI but with empty product list  
      setProducts([]);
    }
  };

  const saveOffer = async (offer: ActiveOffer) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/challenge-offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          whopProductId: offer.product.id,
          offerType: offer.type,
          discountPercentage: offer.discount,
          timeLimit: 48,
          productName: offer.product.name,
          originalPrice: offer.product.price
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the offer with the ID from the server
        return { ...offer, id: data.offer?.id || Date.now().toString() };
      } else {
        console.error('Failed to save offer:', await response.text());
        return offer;
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      return offer;
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (offerId: string, type: string) => {
    try {
      // Remove from local state immediately for better UX
      setActiveOffers(offers => offers.filter(o => !(o.id === offerId || o.type === type)));
      
      // Call delete API
      const response = await fetch(`/api/admin/challenge-offers/${offerId}?challengeId=${challengeId}&offerType=${type}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        console.error('Failed to delete offer:', await response.text());
        // Reload offers on error to restore state
        loadOffers();
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      // Reload offers on error to restore state
      loadOffers();
    }
  };

  const totalRevenue = activeOffers.reduce((sum, offer) => sum + offer.revenue, 0);
  const totalConversions = activeOffers.reduce((sum, offer) => sum + offer.conversions, 0);

  const hasCompletionOffer = activeOffers.some(offer => offer.type === "completion");
  const hasMidChallengeOffer = activeOffers.some(offer => offer.type === "mid_challenge");

  const createCompletionOffer = async () => {
    const selectedProduct = products.find(p => p.id === completionSetup.product);
    if (!selectedProduct) return;

    const newOffer: ActiveOffer = {
      type: "completion",
      product: selectedProduct,
      discount: completionSetup.discount,
      status: "active",
      conversions: 0,
      revenue: 0
    };

    const savedOffer = await saveOffer(newOffer);
    setActiveOffers([...activeOffers.filter(o => o.type !== "completion"), savedOffer]);
    setCompletionSetup({ product: "", discount: 15 });
  };

  const createMidChallengeOffer = async () => {
    const selectedProduct = products.find(p => p.id === midChallengeSetup.product);
    if (!selectedProduct) return;

    const newOffer: ActiveOffer = {
      type: "mid_challenge",
      product: selectedProduct,
      discount: midChallengeSetup.discount,
      status: "active",
      conversions: 0,
      revenue: 0
    };

    const savedOffer = await saveOffer(newOffer);
    setActiveOffers([...activeOffers.filter(o => o.type !== "mid_challenge"), savedOffer]);
    setMidChallengeSetup({ product: "", discount: 25 });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Monetization Status</h3>
              <p className="text-sm text-gray-600">Active offers and revenue tracking</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">${totalRevenue}</div>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{totalConversions}</div>
              <p className="text-sm text-gray-600">Total Conversions</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Offer Cards in Row Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Challenge Completion Offers */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-lg">Challenge Completion</h3>
                  <p className="text-sm text-gray-600">Reward users who complete the challenge</p>
                </div>
              </div>
              {hasCompletionOffer && <Badge className="bg-green-100 text-green-800">Active</Badge>}
            </div>

            {hasCompletionOffer ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                {activeOffers.filter(o => o.type === "completion").map(offer => (
                  <div key="completion" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-700">{offer.product.name}</div>
                          <div className="text-sm text-green-600">
                            {offer.discount}% discount • ${Math.round(offer.product.price * (1 - offer.discount/100))} 
                            <span className="line-through ml-2 text-gray-400">${offer.product.price}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-3">
                          <div className="font-medium text-green-600">${offer.revenue}</div>
                          <div className="text-sm text-gray-600">{offer.conversions} sales</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCompletionSetup({
                                product: offer.product.id,
                                discount: offer.discount
                              });
                              deleteOffer(offer.id || '', 'completion');
                            }}
                            className="px-3 py-2 h-8 bg-green-50 hover:bg-green-100 border border-green-300 rounded-lg text-sm font-medium transition-colors inline-flex items-center"
                            style={{ color: '#15803d !important' }}
                            title="Edit Offer"
                          >
                            <Edit className="h-3 w-3 mr-1" style={{ color: '#15803d' }} />
                            <span style={{ color: '#15803d' }}>Edit</span>
                          </button>
                          <button
                            onClick={() => deleteOffer(offer.id || '', 'completion')}
                            className="px-3 py-2 h-8 bg-green-50 hover:bg-green-100 border border-green-300 rounded-lg text-sm font-medium transition-colors inline-flex items-center"
                            style={{ color: '#15803d !important' }}
                            title="Delete Offer"
                          >
                            <Trash2 className="h-3 w-3 mr-1" style={{ color: '#15803d' }} />
                            <span style={{ color: '#15803d' }}>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {products.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <ShoppingBag className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-yellow-800 mb-2">No Whop Products Available</h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      To create completion offers, you need to add products to your Whop store first.
                    </p>
                    <div className="space-y-2 text-sm text-yellow-600">
                      <p>1. Go to your Whop dashboard</p>
                      <p>2. Create digital products (courses, coaching, communities)</p>
                      <p>3. Return here to create special offers</p>
                    </div>
                    <Button 
                      onClick={() => window.open('https://whop.com/dashboard', '_blank')}
                      className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Open Whop Dashboard
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Product</label>
                        <Select
                          value={completionSetup.product}
                          onChange={(e) => setCompletionSetup({...completionSetup, product: e.target.value})}
                        >
                          <option value="">Select product...</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} - ${product.price}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Discount</label>
                        <Select
                          value={completionSetup.discount.toString()}
                          onChange={(e) => setCompletionSetup({...completionSetup, discount: parseInt(e.target.value)})}
                        >
                          <option value="10">10% off</option>
                          <option value="15">15% off</option>
                          <option value="20">20% off</option>
                          <option value="25">25% off</option>
                          <option value="30">30% off</option>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      onClick={createCompletionOffer}
                      disabled={!completionSetup.product || saving}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saving ? "Creating..." : "Create Completion Offer"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Mid-Challenge Boost */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg">Mid-Challenge Boost</h3>
                  <p className="text-sm text-gray-600">Motivate users during the challenge</p>
                </div>
              </div>
              {hasMidChallengeOffer && <Badge className="bg-blue-100 text-blue-800">Active</Badge>}
            </div>

            {hasMidChallengeOffer ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {activeOffers.filter(o => o.type === "mid_challenge").map(offer => (
                  <div key="mid_challenge" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-700">{offer.product.name}</div>
                          <div className="text-sm text-blue-600">
                            {offer.discount}% discount • ${Math.round(offer.product.price * (1 - offer.discount/100))} 
                            <span className="line-through ml-2 text-gray-400">${offer.product.price}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-3">
                          <div className="font-medium text-blue-600">${offer.revenue}</div>
                          <div className="text-sm text-gray-600">{offer.conversions} sales</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setMidChallengeSetup({
                                product: offer.product.id,
                                discount: offer.discount
                              });
                              deleteOffer(offer.id || '', 'mid_challenge');
                            }}
                            className="px-3 py-2 h-8 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg text-sm font-medium transition-colors inline-flex items-center"
                            style={{ color: '#1d4ed8 !important' }}
                            title="Edit Offer"
                          >
                            <Edit className="h-3 w-3 mr-1" style={{ color: '#1d4ed8' }} />
                            <span style={{ color: '#1d4ed8' }}>Edit</span>
                          </button>
                          <button
                            onClick={() => deleteOffer(offer.id || '', 'mid_challenge')}
                            className="px-3 py-2 h-8 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg text-sm font-medium transition-colors inline-flex items-center"
                            style={{ color: '#1d4ed8 !important' }}
                            title="Delete Offer"
                          >
                            <Trash2 className="h-3 w-3 mr-1" style={{ color: '#1d4ed8' }} />
                            <span style={{ color: '#1d4ed8' }}>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {products.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-blue-800 mb-2">No Whop Products Available</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      To create mid-challenge boosts, you need to add products to your Whop store first.
                    </p>
                    <div className="space-y-2 text-sm text-blue-600">
                      <p>1. Go to your Whop dashboard</p>
                      <p>2. Create digital products (courses, coaching, communities)</p>
                      <p>3. Return here to create special offers</p>
                    </div>
                    <Button 
                      onClick={() => window.open('https://whop.com/dashboard', '_blank')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Open Whop Dashboard
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Product</label>
                        <Select
                          value={midChallengeSetup.product}
                          onChange={(e) => setMidChallengeSetup({...midChallengeSetup, product: e.target.value})}
                        >
                          <option value="">Select product...</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} - ${product.price}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Discount</label>
                        <Select
                          value={midChallengeSetup.discount.toString()}
                          onChange={(e) => setMidChallengeSetup({...midChallengeSetup, discount: parseInt(e.target.value)})}
                        >
                          <option value="15">15% off</option>
                          <option value="20">20% off</option>
                          <option value="25">25% off</option>
                          <option value="30">30% off</option>
                          <option value="35">35% off</option>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      onClick={createMidChallengeOffer}
                      disabled={!midChallengeSetup.product || saving}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {saving ? "Creating..." : "Create Mid-Challenge Boost"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
