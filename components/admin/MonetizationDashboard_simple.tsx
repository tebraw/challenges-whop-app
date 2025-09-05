"use client";

import { useState } from "react";
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
  Settings
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
  type: "completion" | "mid_challenge";
  product: Product;
  discount: number;
  status: "active";
  conversions: number;
  revenue: number;
}

export default function MonetizationDashboard({ challengeId, challengeData }: MonetizationDashboardProps) {
  const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([
    {
      type: "completion",
      product: { id: "1", name: "Premium Training Plan", price: 97 },
      discount: 15,
      status: "active",
      conversions: 12,
      revenue: 1164
    }
  ]);

  const [completionSetup, setCompletionSetup] = useState({
    product: "",
    discount: 15
  });

  const [midChallengeSetup, setMidChallengeSetup] = useState({
    product: "",
    discount: 25
  });

  const products: Product[] = [
    { id: "1", name: "Premium Training Plan", price: 97 },
    { id: "2", name: "VIP Coaching Program", price: 197 },
    { id: "3", name: "Nutrition Guide Bundle", price: 47 }
  ];

  const totalRevenue = activeOffers.reduce((sum, offer) => sum + offer.revenue, 0);
  const totalConversions = activeOffers.reduce((sum, offer) => sum + offer.conversions, 0);

  const hasCompletionOffer = activeOffers.some(offer => offer.type === "completion");
  const hasMidChallengeOffer = activeOffers.some(offer => offer.type === "mid_challenge");

  const createCompletionOffer = () => {
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

    setActiveOffers([...activeOffers.filter(o => o.type !== "completion"), newOffer]);
    setCompletionSetup({ product: "", discount: 15 });
  };

  const createMidChallengeOffer = () => {
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

    setActiveOffers([...activeOffers.filter(o => o.type !== "mid_challenge"), newOffer]);
    setMidChallengeSetup({ product: "", discount: 25 });
  };

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
                <div key="completion" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">{offer.product.name}</div>
                      <div className="text-sm text-gray-600">
                        {offer.discount}% discount • ${Math.round(offer.product.price * (1 - offer.discount/100))} 
                        <span className="line-through ml-2 text-gray-400">${offer.product.price}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">${offer.revenue}</div>
                    <div className="text-sm text-gray-600">{offer.conversions} sales</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                disabled={!completionSetup.product}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Create Completion Offer
              </Button>
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
                <div key="mid_challenge" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">{offer.product.name}</div>
                      <div className="text-sm text-gray-600">
                        {offer.discount}% discount • ${Math.round(offer.product.price * (1 - offer.discount/100))} 
                        <span className="line-through ml-2 text-gray-400">${offer.product.price}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-600">${offer.revenue}</div>
                    <div className="text-sm text-gray-600">{offer.conversions} sales</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                disabled={!midChallengeSetup.product}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Mid-Challenge Boost
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
