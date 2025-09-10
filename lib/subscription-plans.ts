export interface SubscriptionPlan {
  id: string;
  name: string;
  whopProductId: string;
  price: number;
  currency: string;
  limits: {
    challengesPerMonth: number;
    participantsPerChallenge: number;
    features: string[];
  };
  description: string;
  isPopular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    whopProductId: 'prod_YByUE3J5oT4Fq',
    price: 29,
    currency: 'USD',
    limits: {
      challengesPerMonth: 5,
      participantsPerChallenge: 200,
      features: [
        'Up to 5 challenges per month',
        'Up to 200 participants per challenge',
        'Basic analytics',
        'Email support'
      ]
    },
    description: 'Perfect for small teams and startups'
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    whopProductId: 'prod_Tj4T1U7pVwtgb',
    price: 99,
    currency: 'USD',
    limits: {
      challengesPerMonth: -1, // Unlimited
      participantsPerChallenge: -1, // Unlimited
      features: [
        'Unlimited challenges',
        'Unlimited participants',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'API access'
      ]
    },
    description: 'For growing businesses and enterprises',
    isPopular: true
  }
];

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

export function getPlanByWhopProductId(productId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.whopProductId === productId);
}

export interface SubscriptionLimits {
  challengesRemaining: number;
  challengesUsed: number;
  challengesLimit: number;
  participantsLimit: number;
  canCreateChallenge: boolean;
  canAddParticipants: (currentCount: number) => boolean;
}

export interface MonthlyUsage {
  id: string;
  tenantId: string;
  month: string; // Format: YYYY-MM
  challengesCreated: number;
  createdAt: Date;
  updatedAt: Date;
}
