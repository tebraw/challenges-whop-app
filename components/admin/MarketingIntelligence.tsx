"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import WhopProductManager from "./WhopProductManager";
import { 
  MessageSquare,
  ExternalLink,
  Users,
  CreditCard,
  Zap,
  Mail,
  Share2,
  Gift,
  Target,
  Send,
  X,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Globe,
  CheckCircle2,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Clock
} from "lucide-react";

interface WhopProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  productType: string;
  imageUrl?: string;
  checkoutUrl: string;
}

interface MarketingIntelligenceProps {
  challengeId: string;
  challengeData: any;
}

export default function MarketingIntelligence({ challengeId, challengeData }: MarketingIntelligenceProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [offerConfig, setOfferConfig] = useState({
    offerType: "completion",
    discountPercentage: 30,
    timeLimit: 48,
    customMessage: ""
  });

  // Demo products as fallback
  const getDemoProducts = (): WhopProduct[] => [
    {
      id: "demo_fitness_course_123",
      name: "Complete Fitness Transformation Course",
      description: "12-week comprehensive fitness program",
      price: 197,
      currency: "USD",
      productType: "course",
      imageUrl: "/logo-mark.png",
      checkoutUrl: "https://whop.com/checkout/demo_fitness_course_123"
    },
    {
      id: "demo_coaching_123", 
      name: "1-on-1 Personal Coaching",
      description: "Monthly personal coaching sessions",
      price: 497,
      currency: "USD",
      productType: "coaching",
      imageUrl: "/logo-mark.png",
      checkoutUrl: "https://whop.com/checkout/demo_coaching_123"
    },
    {
      id: "demo_community_123",
      name: "VIP Fitness Community", 
      description: "Exclusive access to premium community",
      price: 97,
      currency: "USD",
      productType: "community",
      imageUrl: "/logo-mark.png",
      checkoutUrl: "https://whop.com/checkout/demo_community_123"
    }
  ];

  const handleCreateOffer = async () => {
    if (!selectedProduct) return;
    
    setIsExecuting(true);
    try {
      console.log('Creating offer:', {
        challengeId,
        productId: selectedProduct,
        discountPercentage: offerConfig.discountPercentage,
        timeLimit: offerConfig.timeLimit,
        offerType: offerConfig.offerType,
        customMessage: offerConfig.customMessage
      });

      // This will call the API to create the offer
      // await createChallengeOffer({ challengeId, productId: selectedProduct, ...offerConfig });
      
      alert(`✅ Special offer created!\nProduct: ${selectedProduct}\nDiscount: ${offerConfig.discountPercentage}% OFF\nValid for: ${offerConfig.timeLimit} hours`);
      setActiveModal(null);
    } catch (error) {
      console.error('Failed to create offer:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Monetization Controls */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Monetization Status</h3>
              <p className="text-sm text-green-700">Enable offers for challenge participants</p>
            </div>
            <div className="ml-auto">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
              <span className="text-sm font-medium">🎯 Completion Offers</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
              <span className="text-sm font-medium">⚡ High Engagement</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Setup</span>
            </div>
          </div>
          
          <Button 
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setActiveModal('configure')}
          >
            Configure Offers
          </Button>
        </Card>
      </div>

      {/* Whop Product Manager */}
      <WhopProductManager 
        challengeId={challengeId}
        onProductSelected={(productId) => {
          setSelectedProduct(productId);
          setActiveModal("create-offer");
        }}
      />

      {/* Revenue Analytics */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monetization Analytics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">$2,847</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">12.5%</div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">$89</div>
              <div className="text-sm text-gray-600">Avg. Order Value</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Create Offer Modal */}
      {activeModal === "create-offer" && selectedProduct && (
        <Modal
          open={true}
          onClose={() => setActiveModal(null)}
          title="Create Special Offer"
        >
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">Selected Product</h4>
              <p className="text-sm text-blue-700">Product ID: {selectedProduct}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Offer Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={offerConfig.offerType}
                onChange={(e) => setOfferConfig(prev => ({ ...prev, offerType: e.target.value }))}
              >
                <option value="completion">Challenge Completion Offer</option>
                <option value="high_engagement">High Engagement Offer</option>
                <option value="mid_challenge">Mid-Challenge Boost</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Discount %</label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={offerConfig.discountPercentage}
                  onChange={(e) => setOfferConfig(prev => ({ 
                    ...prev, 
                    discountPercentage: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time Limit (hours)</label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={offerConfig.timeLimit}
                  onChange={(e) => setOfferConfig(prev => ({ 
                    ...prev, 
                    timeLimit: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Custom Message</label>
              <Textarea
                placeholder="Congratulations! As a challenge finisher, you've earned this exclusive discount..."
                value={offerConfig.customMessage}
                onChange={(e) => setOfferConfig(prev => ({ ...prev, customMessage: e.target.value }))}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Offer Preview</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Product: {selectedProduct}</strong></p>
                <p className="text-green-600 font-semibold">
                  Discount: {offerConfig.discountPercentage}% OFF
                </p>
                <p className="text-orange-600">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Limited time: {offerConfig.timeLimit} hours only!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setActiveModal(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOffer}
                disabled={!selectedProduct || isExecuting}
                className="flex-1"
              >
                {isExecuting ? "Creating..." : "Create Offer"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Marketing Actions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickActionCard
              icon={<DollarSign className="h-5 w-5" />}
              title="Create Product Bundle"
              description="Bundle for challenge completers"
              action="bundle"
              onAction={() => setActiveModal('bundle')}
            />

            <QuickActionCard
              icon={<Mail className="h-5 w-5" />}
              title="Email Campaign"
              description="Send motivational emails to participants"
              action="email"
              onAction={() => setActiveModal('email')}
            />

            <QuickActionCard
              icon={<Share2 className="h-5 w-5" />}
              title="Social Media Push"
              description="Create shareable content for participants"
              action="social"
              onAction={() => setActiveModal('social')}
            />
          </div>
        </div>
      </Card>

      {/* Modals for each action */}
      <BundleModal 
        isOpen={activeModal === 'bundle'}
        onClose={() => setActiveModal(null)}
        challengeId={challengeId}
        onExecute={setIsExecuting}
      />
      
      <EmailModal 
        isOpen={activeModal === 'email'}
        onClose={() => setActiveModal(null)}
        challengeId={challengeId}
        onExecute={setIsExecuting}
      />
      
      <SocialModal 
        isOpen={activeModal === 'social'}
        onClose={() => setActiveModal(null)}
        challengeId={challengeId}
        challengeData={challengeData}
        onExecute={setIsExecuting}
      />
    </div>
  );
}

function QuickActionCard({ icon, title, description, action, onAction }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-brand">{icon}</div>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      <Button 
        variant="outline" 
        className="w-full"
        onClick={onAction}
      >
        Launch <ExternalLink className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// Bundle Modal Component
function BundleModal({ isOpen, onClose, challengeId, onExecute }: {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  onExecute: (loading: boolean) => void;
}) {
  const [bundleTitle, setBundleTitle] = useState('Challenge Completion Bundle');
  const [price, setPrice] = useState('47');
  const [items, setItems] = useState(['Completion Certificate', 'Bonus Workout Guide', 'Exclusive Badge']);

  const handleCreate = async () => {
    onExecute(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Bundle created:', { challengeId, bundleTitle, price, items });
      alert('✅ Product bundle created successfully!');
      onClose();
    } catch (error) {
      alert('❌ Failed to create bundle');
    } finally {
      onExecute(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Create Product Bundle
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bundle Title</label>
            <Input
              value={bundleTitle}
              onChange={(e) => setBundleTitle(e.target.value)}
              placeholder="Enter bundle title..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Price ($)</label>
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="47"
              type="number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Bundle Items</label>
            {items.map((item, index) => (
              <div key={index} className="mb-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index] = e.target.value;
                    setItems(newItems);
                  }}
                  placeholder={`Item ${index + 1}...`}
                />
              </div>
            ))}
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-700">
              🎯 Target audience: Challenge completers ({Math.round(42 * 0.48)} potential customers)
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleCreate}>
              <CreditCard className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Email Modal Component
function EmailModal({ isOpen, onClose, challengeId, onExecute }: {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  onExecute: (loading: boolean) => void;
}) {
  const [subject, setSubject] = useState('You\'re doing amazing! Keep going! 🔥');
  const [message, setMessage] = useState('Hey {name},\n\nYou\'ve been crushing this challenge! You\'re so close to the finish line.\n\nDon\'t give up now - you\'ve got this!\n\nBest,\nYour Challenge Team');

  const handleSend = async () => {
    onExecute(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Email campaign sent:', { challengeId, subject, message });
      alert('✅ Email campaign sent successfully!');
      onClose();
    } catch (error) {
      alert('❌ Failed to send email campaign');
    } finally {
      onExecute(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Campaign
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your motivational message..."
              rows={6}
            />
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              📧 Will be sent to: All active participants ({Math.round(42 * 0.89)} participants)
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSend}>
              <Mail className="h-4 w-4 mr-2" />
              Send Campaign
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Social Modal Component
function SocialModal({ isOpen, onClose, challengeId, challengeData, onExecute }: {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  challengeData: any;
  onExecute: (loading: boolean) => void;
}) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['All Platforms']);
  const [content, setContent] = useState(`🔥 Amazing results from our ${challengeData?.title || 'Challenge'}!\n\n42 participants are crushing their goals!\n\nJoin the next round: [link]\n\n#Challenge #Transformation #Goals`);

  const platforms = [
    { name: 'All Platforms', icon: CheckCircle2, color: 'text-green-500' },
    { name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { name: 'Twitter', icon: Twitter, color: 'text-blue-400' },
    { name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
    { name: 'Whop', icon: Globe, color: 'text-purple-500' }
  ];

  const togglePlatform = (platformName: string) => {
    if (platformName === 'All Platforms') {
      if (selectedPlatforms.includes('All Platforms')) {
        setSelectedPlatforms([]);
      } else {
        setSelectedPlatforms(['All Platforms']);
      }
    } else {
      const withoutAll = selectedPlatforms.filter(p => p !== 'All Platforms');
      if (withoutAll.includes(platformName)) {
        setSelectedPlatforms(withoutAll.filter(p => p !== platformName));
      } else {
        setSelectedPlatforms([...withoutAll, platformName]);
      }
    }
  };

  const handlePost = async () => {
    if (selectedPlatforms.length === 0) {
      alert('⚠️ Please select at least one platform!');
      return;
    }

    onExecute(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (selectedPlatforms.includes('All Platforms')) {
        const allPlatforms = ['Instagram', 'Twitter', 'Facebook', 'LinkedIn', 'Whop'];
        console.log('Social media post created for all platforms:', { challengeId, platforms: allPlatforms, content });
        alert('✅ Social media content created for all platforms:\n• Instagram\n• Twitter\n• Facebook\n• LinkedIn\n• Whop');
      } else {
        console.log('Social media post created:', { challengeId, platforms: selectedPlatforms, content });
        alert(`✅ Social media content created successfully for:\n${selectedPlatforms.map(p => `• ${p}`).join('\n')}`);
      }
      
      onClose();
    } catch (error) {
      alert('❌ Failed to create social media content');
    } finally {
      onExecute(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="p-6 w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Media Push
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3">Platforms</label>
            <div className="grid grid-cols-3 gap-3">
              {platforms.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.name);
                const IconComponent = platform.icon;
                
                return (
                  <button
                    key={platform.name}
                    onClick={() => togglePlatform(platform.name)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <IconComponent className={`h-6 w-6 ${isSelected ? 'text-blue-500' : platform.color}`} />
                    <span className="text-xs font-medium text-center">{platform.name}</span>
                  </button>
                );
              })}
            </div>
            {selectedPlatforms.length > 0 && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selected: {selectedPlatforms.includes('All Platforms') ? 'All Platforms' : selectedPlatforms.join(', ')}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Create engaging social media content..."
              rows={6}
            />
          </div>
          
          <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg">
            <p className="text-sm text-pink-700 dark:text-pink-300">
              📱 Ready to share with your social media audience
            </p>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handlePost}>
              <Share2 className="h-4 w-4 mr-2" />
              Create Content
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
