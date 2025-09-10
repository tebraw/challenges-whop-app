// lib/whopApi.ts

// Enhanced Whop API integration for full monetization support
const WHOP_API_BASE = process.env.WHOP_API_BASE_URL || 'https://api.whop.com';
const WHOP_API_KEY = process.env.WHOP_API_KEY;
const PLATFORM_FEE_PERCENTAGE = Number(process.env.PLATFORM_FEE_PERCENTAGE) || 10;

export interface WhopProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  product_type: string;
  image_url?: string;
  checkout_url: string;
  is_active: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface WhopSubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  whopProductId?: string;
  checkoutUrl?: string;
  isActive: boolean;
}

export interface WhopOffer {
  id: string;
  product_id: string;
  discount_percentage?: number;
  discount_amount?: number;
  original_price: number;
  discounted_price: number;
  expires_at?: string;
  checkout_url: string;
  custom_message?: string;
}

export interface WhopCreator {
  id: string;
  name: string;
  avatar?: string;
  isFollowed: boolean;
  categories?: string[];
  products?: WhopProduct[];
  subscriptionTier?: string;
  monthlyRevenue?: number;
  totalEarnings?: number;
}

export interface WhopUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  followedCreators: string[]; // Array of creator IDs
  subscriptionTier?: string;
  subscriptionStatus?: 'ACTIVE' | 'CANCELLED' | 'PENDING';
}

// Subscription Tiers Configuration
export const SUBSCRIPTION_TIERS: WhopSubscriptionTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    currency: 'USD',
    features: [
      'Up to 3 active challenges',
      'Basic analytics',
      'Email support',
      '10% revenue share on special offers',
      'Free community integration'
    ],
    isActive: true
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 49,
    currency: 'USD',
    features: [
      'Up to 15 active challenges',
      'Advanced analytics & insights',
      'Priority support',
      '10% revenue share on special offers',
      'Premium features',
      'Custom branding options'
    ],
    isActive: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 79,
    currency: 'USD',
    features: [
      'Unlimited challenges',
      'Full analytics suite',
      'Dedicated support manager',
      '10% revenue share on special offers',
      'White-label solution',
      'API access',
      'Custom integrations'
    ],
    isActive: true
  }
];

// Revenue Calculation Functions
export function calculateRevenueSplit(totalAmount: number): {
  creatorAmount: number;
  platformFee: number;
  platformFeePercentage: number;
} {
  const platformFee = Math.floor(totalAmount * (PLATFORM_FEE_PERCENTAGE / 100));
  const creatorAmount = totalAmount - platformFee;
  
  return {
    creatorAmount,
    platformFee,
    platformFeePercentage: PLATFORM_FEE_PERCENTAGE
  };
}

export function formatRevenueSplit(totalAmount: number): string {
  const { creatorAmount, platformFee } = calculateRevenueSplit(totalAmount);
  return `Creator: $${(creatorAmount/100).toFixed(2)} | Platform: $${(platformFee/100).toFixed(2)}`;
}

export interface WhopMessage {
  id: string;
  userId: string;
  message: string;
  title?: string;
  sent_at: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface WhopNotificationRequest {
  userId: string;
  message: string;
  title?: string;
}

export interface WhopCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  slug: string;
}

export interface WhopChallenge {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  imageUrl?: string;
}

// Mock categories - replace with actual Whop API data
const mockCategories: WhopCategory[] = [
  { id: "cat_fitness", name: "Fitness", description: "Health and fitness challenges", icon: "💪", color: "#ef4444", slug: "fitness" },
  { id: "cat_productivity", name: "Productivity", description: "Productivity and work challenges", icon: "📈", color: "#3b82f6", slug: "productivity" },
  { id: "cat_learning", name: "Learning", description: "Learning and education challenges", icon: "🧠", color: "#10b981", slug: "learning" },
  { id: "cat_mindfulness", name: "Mindfulness", description: "Mindfulness and wellness challenges", icon: "🧘", color: "#8b5cf6", slug: "mindfulness" },
  { id: "cat_creativity", name: "Creativity", description: "Creative and artistic challenges", icon: "🎨", color: "#f59e0b", slug: "creativity" },
  { id: "cat_social", name: "Social", description: "Social and community challenges", icon: "👥", color: "#ec4899", slug: "social" },
  { id: "cat_finance", name: "Finance", description: "Financial and money challenges", icon: "💰", color: "#059669", slug: "finance" },
  { id: "cat_lifestyle", name: "Lifestyle", description: "General lifestyle challenges", icon: "🌟", color: "#6366f1", slug: "lifestyle" }
];

// Mock function - replace with actual Whop API call
export async function getUserFollowedCreators(whopUserId: string): Promise<string[]> {
  // TODO: Replace with actual Whop API call
  // Example: GET /api/users/{whopUserId}/following
  
  // For now, return mock data
  return Promise.resolve([
    "creator_1",
    "creator_2", 
    "creator_3"
  ]);
}

// Mock function - replace with actual Whop API call
export async function getWhopUserData(whopUserId: string): Promise<WhopUser | null> {
  // TODO: Replace with actual Whop API call
  // Example: GET /api/users/{whopUserId}
  
  // For now, return mock data
  return Promise.resolve({
    id: whopUserId,
    email: "user@example.com",
    name: "Test User",
    followedCreators: await getUserFollowedCreators(whopUserId)
  });
}

// Mock function - replace with actual Whop API call
export async function getCreatorInfo(creatorId: string): Promise<WhopCreator | null> {
  // TODO: Replace with actual Whop API call
  // Example: GET /api/creators/{creatorId}
  
  const mockCreators: Record<string, WhopCreator> = {
    "creator_1": {
      id: "creator_1",
      name: "Fitness Creator",
      avatar: "/logo-mark.png",
      isFollowed: true,
      categories: ["cat_fitness", "cat_lifestyle"]
    },
    "creator_2": {
      id: "creator_2", 
      name: "Productivity Guru",
      avatar: "/logo-mark.png",
      isFollowed: true,
      categories: ["cat_productivity", "cat_learning"]
    },
    "creator_3": {
      id: "creator_3",
      name: "Learning Expert", 
      avatar: "/logo-mark.png",
      isFollowed: true,
      categories: ["cat_learning", "cat_creativity"]
    }
  };

  return Promise.resolve(mockCreators[creatorId] || null);
}

// Get creator's products from Whop
export async function getCreatorProducts(creatorId: string): Promise<WhopProduct[]> {
  try {
    if (!WHOP_API_KEY) {
      console.warn('Whop API key not configured - using fallback');
      return getMockProducts();
    }

    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      console.log(`🚀 Using enhanced Whop API with full scopes for creator: ${creatorId}`);
    }
    
    // 🎯 TRY MULTIPLE ENDPOINTS WITH NEW SCOPES
    const endpoints = [
      // Primary endpoint with plan:read scope
      {
        url: `${WHOP_API_BASE}/api/v2/companies/${creatorId}/plans?per=50&expand=product`,
        name: 'Company Plans v2'
      },
      // Fallback with plan:basic:read
      {
        url: `${WHOP_API_BASE}/api/v5/plans?company_id=${creatorId}&per=50`,
        name: 'Plans v5'
      },
      // New products endpoint with plan:stats:read
      {
        url: `${WHOP_API_BASE}/api/v2/products?creator_id=${creatorId}&per=50`,
        name: 'Products v2'
      }
    ];

    for (const endpoint of endpoints) {
      try {
        if (!isProduction) {
          console.log(`🔍 Trying ${endpoint.name}: ${endpoint.url}`);
        }
        
        const response = await fetch(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${WHOP_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!isProduction) {
          console.log(`📊 ${endpoint.name} response: ${response.status}`);
        }
        
        if (response.ok) {
          const data = await response.json();
          if (!isProduction) {
            console.log(`✅ ${endpoint.name} success:`, data);
          }
          
          // Transform data to consistent format
          let products = [];
          
          if (data.plans) {
            products = data.plans;
          } else if (data.data) {
            products = Array.isArray(data.data) ? data.data : [data.data];
          } else if (Array.isArray(data)) {
            products = data;
          }

          if (products.length > 0) {
            // Transform to our format with enhanced features
            const transformedProducts: WhopProduct[] = products.map((plan: any) => ({
              id: plan.id,
              title: plan.product?.title || plan.title || `Plan ${plan.id}`,
              description: plan.product?.description || plan.description || plan.payment_link_description,
              price: plan.initial_price || plan.price || 0,
              currency: plan.base_currency || plan.currency || 'USD',
              product_type: plan.plan_type || plan.type || 'digital',
              image_url: plan.product?.image_url || plan.image_url,
              checkout_url: plan.direct_link || plan.checkout_url || `https://whop.com/checkout/${plan.id}`,
              is_active: plan.visibility === 'visible' || plan.is_active !== false,
              creator_id: creatorId,
              created_at: plan.created_at ? new Date(plan.created_at * 1000).toISOString() : new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));

            if (!isProduction) {
              console.log(`🎯 Successfully transformed ${transformedProducts.length} products from ${endpoint.name}`);
            }
            return transformedProducts;
          }
        } else {
          if (!isProduction) {
            const errorText = await response.text();
            console.log(`❌ ${endpoint.name} failed (${response.status}):`, errorText);
          }
        }
      } catch (endpointError) {
        if (!isProduction) {
          console.log(`❌ ${endpoint.name} error:`, endpointError);
        }
      }
    }

    // If all endpoints fail, try fallback
    if (!isProduction) {
      console.log('⚠️ All enhanced endpoints failed, trying fallback...');
    }
    return await getCreatorProductsFallback(creatorId);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching creator products with enhanced scopes:', error);
    }
    return getMockProducts();
  }
}

// Fallback method to get products using generic plans endpoint
async function getCreatorProductsFallback(creatorId: string): Promise<WhopProduct[]> {
  try {
    console.log(`Fallback: Fetching all plans and filtering for company: ${creatorId}`);
    
    const response = await fetch(`${WHOP_API_BASE}/api/v2/plans?per=100&expand=product`, {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Fallback Whop API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    console.log('Fallback API response data length:', data.data?.length || 0);
    
    // Filter plans by company ID
    const companyPlans = (data.data || []).filter((plan: any) => 
      plan.product?.biz_id === creatorId || 
      plan.biz_id === creatorId ||
      plan.company_id === creatorId
    );
    
    console.log(`Filtered ${companyPlans.length} plans for company ${creatorId}`);
    
    // Transform filtered plans to our product format
    const products: WhopProduct[] = companyPlans.map((plan: any) => ({
      id: plan.id,
      title: plan.product?.title || `Plan ${plan.id}`,
      description: plan.product?.description || plan.payment_link_description,
      price: plan.initial_price || 0,
      currency: plan.base_currency || 'USD',
      product_type: plan.plan_type || 'digital',
      image_url: plan.product?.image_url,
      checkout_url: plan.direct_link || `https://whop.com/checkout/${plan.id}`,
      is_active: plan.visibility === 'visible',
      creator_id: creatorId,
      created_at: new Date(plan.created_at * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log(`Fallback: Found ${products.length} products/plans for company ${creatorId}`);
    return products;
  } catch (error) {
    console.error('Fallback method also failed:', error);
    return getMockProducts();
  }
}

// Mock products for development and fallback
function getMockProducts(): WhopProduct[] {
  return [
    {
      id: 'mock_premium_course',
      title: '💎 Premium Fitness Course',
      description: 'Complete fitness transformation program',
      price: 9900,
      currency: 'USD',
      product_type: 'course',
      image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      checkout_url: 'https://whop.com/checkout/mock_premium_course',
      is_active: true,
      creator_id: 'mock_creator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock_supplement_bundle',
      title: '🥤 Elite Supplement Bundle',
      description: 'Professional-grade supplements bundle',
      price: 14900,
      currency: 'USD',
      product_type: 'physical',
      image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      checkout_url: 'https://whop.com/checkout/mock_supplement_bundle',
      is_active: true,
      creator_id: 'mock_creator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

// Create special offer for a product
export async function createWhopOffer(productId: string, offerConfig: {
  discount_percentage?: number;
  discount_amount?: number;
  expires_in_hours?: number;
  custom_message?: string;
}): Promise<WhopOffer | null> {
  try {
    if (!WHOP_API_KEY) {
      // Return mock offer for development
      return getMockOffer(productId, offerConfig);
    }

    const response = await fetch(`${WHOP_API_BASE}/products/${productId}/offers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        discount_percentage: offerConfig.discount_percentage,
        discount_amount: offerConfig.discount_amount,
        expires_at: offerConfig.expires_in_hours 
          ? new Date(Date.now() + offerConfig.expires_in_hours * 60 * 60 * 1000).toISOString()
          : undefined,
        custom_message: offerConfig.custom_message
      })
    });

    if (!response.ok) {
      throw new Error(`Whop API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Whop offer:', error);
    return getMockOffer(productId, offerConfig);
  }
}

// Track conversion event
export async function trackWhopConversion(offerUrl: string, userId: string, eventType: 'view' | 'click' | 'purchase') {
  try {
    if (!WHOP_API_KEY) {
      console.log('Mock conversion tracked:', { offerUrl, userId, eventType });
      return;
    }

    await fetch(`${WHOP_API_BASE}/analytics/conversions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        offer_url: offerUrl,
        user_id: userId,
        event_type: eventType,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
}

// Mock functions for development
function getMockCreatorProducts(creatorId: string): WhopProduct[] {
  const mockProducts: WhopProduct[] = [
    {
      id: "prod_fitness_course_123",
      title: "Complete Fitness Transformation Course",
      description: "12-week comprehensive fitness program with meal plans and workout routines",
      price: 197,
      currency: "USD",
      product_type: "course",
      image_url: "/logo-mark.png",
      checkout_url: "https://whop.com/checkout/prod_fitness_course_123",
      is_active: true,
      creator_id: creatorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "prod_coaching_123",
      title: "1-on-1 Personal Coaching",
      description: "Monthly personal coaching sessions with customized plans",
      price: 497,
      currency: "USD",
      product_type: "coaching",
      image_url: "/logo-mark.png", 
      checkout_url: "https://whop.com/checkout/prod_coaching_123",
      is_active: true,
      creator_id: creatorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "prod_community_123",
      title: "VIP Fitness Community",
      description: "Exclusive access to premium community with daily support",
      price: 97,
      currency: "USD",
      product_type: "community",
      image_url: "/logo-mark.png",
      checkout_url: "https://whop.com/checkout/prod_community_123", 
      is_active: true,
      creator_id: creatorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  return mockProducts;
}

function getMockOffer(productId: string, config: any): WhopOffer {
  const mockProduct = {
    "prod_fitness_course_123": { original_price: 197 },
    "prod_coaching_123": { original_price: 497 },
    "prod_community_123": { original_price: 97 }
  }[productId] || { original_price: 100 };

  const discountedPrice = config.discount_percentage 
    ? mockProduct.original_price * (1 - config.discount_percentage / 100)
    : mockProduct.original_price - (config.discount_amount || 0);

  return {
    id: `offer_${productId}_${Date.now()}`,
    product_id: productId,
    discount_percentage: config.discount_percentage,
    discount_amount: config.discount_amount,
    original_price: mockProduct.original_price,
    discounted_price: Math.round(discountedPrice),
    expires_at: config.expires_in_hours 
      ? new Date(Date.now() + config.expires_in_hours * 60 * 60 * 1000).toISOString()
      : undefined,
    checkout_url: `https://whop.com/checkout/${productId}?offer=special`,
    custom_message: config.custom_message
  };
}

// Get category by ID
export async function getWhopCategoryById(categoryId: string): Promise<WhopCategory | null> {
  // TODO: Replace with actual Whop API call
  // Example: GET /api/categories/{categoryId}
  
  const category = mockCategories.find(cat => cat.id === categoryId);
  return Promise.resolve(category || null);
}

// Get all categories
export async function getWhopCategories(): Promise<WhopCategory[]> {
  // TODO: Replace with actual Whop API call
  // Example: GET /api/categories
  
  return Promise.resolve(mockCategories);
}

// Get challenges by category
export async function getChallengesByCategory(categoryId: string): Promise<WhopChallenge[]> {
  // TODO: Replace with actual Whop API call
  // Example: GET /api/categories/{categoryId}/challenges
  
  // Mock data
  const mockChallenges: WhopChallenge[] = [
    {
      id: "challenge_1",
      title: "30-Day Fitness Challenge",
      description: "Get fit in 30 days",
      creatorId: "creator_1",
      categoryId: "cat_fitness",
      categoryName: "Fitness",
      tags: ["fitness", "health", "30days"],
      imageUrl: "/logo-mark.png"
    }
  ];

  return Promise.resolve(mockChallenges.filter(ch => ch.categoryId === categoryId));
}

// Function to get challenges from followed creators
export async function getChallengesFromFollowedCreators(whopUserId: string) {
  const followedCreators = await getUserFollowedCreators(whopUserId);
  
  // This will be used to filter challenges in the database
  // by matching challenge.whopCreatorId with followedCreators
  return followedCreators;
}

// Sync categories from Whop to local cache
export async function syncWhopCategories() {
  // TODO: This function will periodically sync categories from Whop API
  // to keep local cache up to date
  const categories = mockCategories; // Use local categories for now
  
  // Store in database or cache
  console.log("Synced categories:", categories.length);
  return categories;
}

// Send Whop notification/message to user
export async function sendWhopNotification(notification: WhopNotificationRequest): Promise<boolean> {
  try {
    console.log('🔔 Whop Notification Request:');
    console.log('To User ID:', notification.userId);
    console.log('Title:', notification.title);
    console.log('Message:', notification.message);
    console.log('WHOP_API_KEY present:', !!WHOP_API_KEY);

    // Since Whop doesn't have a direct messaging API endpoint,
    // we'll use alternative notification methods:
    
    // 1. Log the notification for manual processing
    console.log('📧 WINNER NOTIFICATION:');
    console.log(`   User: ${notification.userId}`);
    console.log(`   Title: ${notification.title || 'Winner Announcement'}`);
    console.log(`   Message: ${notification.message}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    
    // 2. Store in database for dashboard display (could be added later)
    // await storeNotificationInDatabase(notification);
    
    // 3. Alternative: Use email notification system if available
    // await sendEmailNotification(notification);
    
    // 4. Alternative: Use Discord/Telegram webhook if configured
    // await sendDiscordNotification(notification);
    
    // For now, simulate success as the notification is logged
    console.log('✅ Notification logged successfully - manual processing required');
    
    return true;

  } catch (error) {
    console.error('Failed to process notification:', error);
    return false;
  }
}

// Get user's Whop ID from their email (for testing)
export async function getWhopUserIdByEmail(email: string): Promise<string | null> {
  // In development, use email as user ID
  if (!WHOP_API_KEY) {
    return `whop_${email.replace('@', '_').replace('.', '_')}`;
  }

  try {
    // TODO: Replace with actual Whop API call
    const response = await fetch(`${WHOP_API_BASE}/users/search?email=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return user?.id || null;
  } catch (error) {
    console.error('Failed to get Whop user ID:', error);
    return null;
  }
}
