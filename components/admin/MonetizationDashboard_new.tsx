"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  ShoppingBag,
  Target,
  TrendingUp,
  Settings,
  DollarSign,
  Globe,
  Eye,
  EyeOff,
  Plus,
  AlertCircle
} from "lucide-react";

interface MonetizationDashboardProps {
  challengeId: string;
  challengeData: {
    title: string;
    participants: number;
  };
}

interface OfferStatus {
  id: string;
  name: string;
  type: "completion" | "mid_challenge" | "high_engagement";
  status: "active" | "inactive" | "draft";
  conversions: number;
  revenue: number;
  views: number;
  discount: number;
}

export default function MonetizationDashboard({ challengeId, challengeData }: MonetizationDashboardProps) {
  const [offers, setOffers] = useState<OfferStatus[]>([
    {
      id: "1",
      name: "Challenge Completion Bonus",
      type: "completion",
      status: "active",
      conversions: 12,
      revenue: 1164,
      views: 89,
      discount: 15
    },
    {
      id: "2", 
      name: "Mid-Challenge Boost",
      type: "mid_challenge",
      status: "inactive",
      conversions: 3,
      revenue: 291,
      views: 34,
      discount: 25
    }
  ]);

  const totalRevenue = offers.reduce((sum, offer) => sum + offer.revenue, 0);
  const totalConversions = offers.reduce((sum, offer) => sum + offer.conversions, 0);
  const totalViews = offers.reduce((sum, offer) => sum + offer.views, 0);
  const conversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : "0";

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "completion": return "Challenge Complete";
      case "mid_challenge": return "Mid Challenge";
      case "high_engagement": return "High Engagement";
      default: return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "completion": return "bg-green-100 text-green-800 border-green-200";
      case "mid_challenge": return "bg-blue-100 text-blue-800 border-blue-200";
      case "high_engagement": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const toggleOfferStatus = (offerId: string) => {
    setOffers(offers.map(offer => 
      offer.id === offerId 
        ? { ...offer, status: offer.status === 'active' ? 'inactive' as const : 'active' as const }
        : offer
    ));
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Monetization Status</h3>
                <p className="text-sm text-gray-600">Active offers and revenue tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">${totalRevenue}</span>
              </div>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{totalConversions}</span>
              </div>
              <p className="text-sm text-gray-600">Conversions</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">{totalViews}</span>
              </div>
              <p className="text-sm text-gray-600">Offer Views</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">{conversionRate}%</span>
              </div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Completion Offers */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">Completion Offers</h3>
              <Badge className="bg-green-100 text-green-800">Ready</Badge>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Offer
            </Button>
          </div>

          {/* Offers List */}
          {offers.length > 0 ? (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${offer.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="font-medium">{offer.name}</span>
                    </div>
                    
                    <Badge className={getTypeBadgeColor(offer.type)}>
                      {getTypeLabel(offer.type)}
                    </Badge>
                    
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      -{offer.discount}% discount
                    </Badge>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-green-600">${offer.revenue}</span>
                      <span className="mx-2">•</span>
                      <span className="font-medium">{offer.conversions}</span> conversions
                      <span className="mx-2">•</span>
                      <span>{offer.views}</span> views
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="px-3 py-1.5">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline"
                        className={`px-3 py-1.5 ${offer.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                        onClick={() => toggleOfferStatus(offer.id)}
                      >
                        {offer.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">No offers configured</h4>
              <p className="text-gray-600 mb-4">Create your first completion offer to start monetizing this challenge.</p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create First Offer
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Configure Offers */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-lg">Configure Offers</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="p-6 h-auto flex-col">
              <Target className="h-8 w-8 text-green-600 mb-3" />
              <span className="font-medium">Completion Offers</span>
              <span className="text-sm text-gray-600 mt-1">Reward challenge completers</span>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col">
              <TrendingUp className="h-8 w-8 text-blue-600 mb-3" />
              <span className="font-medium">Engagement Boosts</span>
              <span className="text-sm text-gray-600 mt-1">Target highly engaged users</span>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col">
              <Globe className="h-8 w-8 text-purple-600 mb-3" />
              <span className="font-medium">Discovery Settings</span>
              <span className="text-sm text-gray-600 mt-1">Public visibility options</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
