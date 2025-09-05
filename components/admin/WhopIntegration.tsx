"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { 
  ExternalLink, 
  ShoppingBag, 
  Users, 
  TrendingUp,
  Link as LinkIcon,
  Zap,
  Target,
  DollarSign
} from "lucide-react";

interface WhopProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  sales_count: number;
  is_active: boolean;
}

interface WhopIntegrationProps {
  challengeId: string;
  participantSegments: any[];
}

export default function WhopIntegration({ challengeId, participantSegments }: WhopIntegrationProps) {
  const [products, setProducts] = useState<WhopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    async function loadWhopData() {
      try {
        // In a real implementation, this would fetch from Whop API
        const mockProducts: WhopProduct[] = [
          {
            id: "prod_1",
            title: "Premium Coaching Package",
            description: "1-on-1 coaching sessions with personalized guidance",
            price: 297,
            currency: "USD",
            category: "coaching",
            sales_count: 23,
            is_active: true
          },
          {
            id: "prod_2", 
            title: "Challenge Master Course",
            description: "Complete course on mastering personal challenges",
            price: 97,
            currency: "USD",
            category: "course",
            sales_count: 156,
            is_active: true
          },
          {
            id: "prod_3",
            title: "VIP Community Access",
            description: "Exclusive access to our premium community",
            price: 29,
            currency: "USD",
            category: "membership",
            sales_count: 78,
            is_active: true
          }
        ];
        
        setProducts(mockProducts);
        generateRecommendations(mockProducts);
      } catch (error) {
        console.error("Failed to load Whop data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadWhopData();
  }, [challengeId, participantSegments]);

  const generateRecommendations = (products: WhopProduct[]) => {
    // Generate smart recommendations based on participant segments
    const recs = [
      {
        id: "rec_1",
        title: "Cross-sell Premium Coaching",
        description: "Target high-engagement participants with coaching offers",
        targetSegment: "Super Engaged",
        targetCount: participantSegments.find(s => s.id === "super_engaged")?.count || 0,
        product: products.find(p => p.category === "coaching"),
        estimatedConversion: "25-35%",
        estimatedRevenue: "$2,000-4,500",
        confidence: 87
      },
      {
        id: "rec_2", 
        title: "Upsell Course to Consistent Performers",
        description: "Offer advanced course content to engaged participants",
        targetSegment: "Consistent Performers",
        targetCount: participantSegments.find(s => s.id === "consistent_performers")?.count || 0,
        product: products.find(p => p.category === "course"),
        estimatedConversion: "15-25%",
        estimatedRevenue: "$1,000-2,500",
        confidence: 73
      },
      {
        id: "rec_3",
        title: "Community Membership for All",
        description: "Low-cost entry point for all participants",
        targetSegment: "All Participants",
        targetCount: participantSegments.reduce((sum, s) => sum + s.count, 0),
        product: products.find(p => p.category === "membership"),
        estimatedConversion: "8-15%",
        estimatedRevenue: "$500-1,200",
        confidence: 65
      }
    ];
    
    setRecommendations(recs);
  };

  const handleCreateCampaign = (recommendation: any) => {
    console.log(`Creating campaign for: ${recommendation.title}`);
    // Implement campaign creation logic
  };

  const handleProductLink = (productId: string, segmentId: string) => {
    console.log(`Linking product ${productId} to segment ${segmentId}`);
    // Implement product linking logic
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Whop Products Overview */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Whop Products
          </h3>
          
          <div className="grid gap-4">
            {products.map((product) => (
              <div key={product.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{product.title}</h4>
                    <p className="text-sm text-muted mb-2">{product.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-brand">
                        ${product.price} {product.currency}
                      </span>
                      <span className="text-muted">
                        {product.sales_count} sales
                      </span>
                      <Badge className={product.is_active ? "bg-green-500" : "bg-gray-500"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in Whop
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Smart Recommendations */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Smart Product Recommendations
          </h3>
          
          <div className="grid gap-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      {rec.title}
                      <Badge className="bg-blue-500">{rec.confidence}% match</Badge>
                    </h4>
                    <p className="text-sm text-muted">{rec.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-brand">{rec.estimatedRevenue}</div>
                    <div className="text-xs text-muted">Est. Revenue</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Target:</span>
                    <div className="text-muted">{rec.targetSegment}</div>
                  </div>
                  <div>
                    <span className="font-medium">Audience:</span>
                    <div className="text-muted">{rec.targetCount} participants</div>
                  </div>
                  <div>
                    <span className="font-medium">Product:</span>
                    <div className="text-muted">{rec.product?.title}</div>
                  </div>
                  <div>
                    <span className="font-medium">Conv. Rate:</span>
                    <div className="text-muted">{rec.estimatedConversion}</div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="primary"
                    onClick={() => handleCreateCampaign(rec)}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleProductLink(rec.product?.id || "", rec.targetSegment)}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Link Product
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Revenue Projection */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Projection
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand">$3,500</div>
              <div className="text-sm text-muted">Conservative Estimate</div>
              <div className="text-xs text-muted mt-1">Based on 10% conversion</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">$8,200</div>
              <div className="text-sm text-muted">Realistic Estimate</div>
              <div className="text-xs text-muted mt-1">Based on segment analysis</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">$15,000</div>
              <div className="text-sm text-muted">Optimistic Estimate</div>
              <div className="text-xs text-muted mt-1">With optimization</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Optimization Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Time offers with challenge completion milestones</li>
              <li>• Create urgency with limited-time bonuses</li>
              <li>• Use social proof from top performers</li>
              <li>• Offer challenge-exclusive pricing</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 text-left">
              <div>
                <div className="font-semibold">Sync Products</div>
                <div className="text-sm text-muted">Update product data from Whop</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 text-left">
              <div>
                <div className="font-semibold">Export Segments</div>
                <div className="text-sm text-muted">Export participant data for targeting</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 text-left">
              <div>
                <div className="font-semibold">Create Bundle</div>
                <div className="text-sm text-muted">Bundle products for challenge completers</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 text-left">
              <div>
                <div className="font-semibold">A/B Test Offers</div>
                <div className="text-sm text-muted">Test different pricing strategies</div>
              </div>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
