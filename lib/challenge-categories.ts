// lib/challenge-categories.ts

export interface CategoryMapping {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  keywords: string[];
  companyPatterns: string[];
}

export const CHALLENGE_CATEGORIES: CategoryMapping[] = [
  {
    id: 'fitness',
    label: 'Fitness',
    icon: '💪',
    color: 'bg-orange-600 hover:bg-orange-500',
    description: 'Get fit and healthy',
    keywords: ['fitness', 'workout', 'gym', 'exercise', 'health', 'steps', 'running', 'training'],
    companyPatterns: ['fit', 'gym', 'health', 'sport', 'wellness', 'active']
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: '📝',
    color: 'bg-blue-600 hover:bg-blue-500',
    description: 'Boost your efficiency',
    keywords: ['productivity', 'work', 'efficiency', 'focus', 'time', 'organization'],
    companyPatterns: ['productivity', 'work', 'business', 'efficiency', 'focus']
  },
  {
    id: 'learning',
    label: 'Learning',
    icon: '🧠',
    color: 'bg-pink-600 hover:bg-pink-500',
    description: 'Expand your knowledge',
    keywords: ['learning', 'education', 'study', 'skill', 'course', 'knowledge'],
    companyPatterns: ['learning', 'education', 'academy', 'school', 'training', 'skill']
  },
  {
    id: 'mindfulness',
    label: 'Mindfulness',
    icon: '🧘',
    color: 'bg-purple-600 hover:bg-purple-500',
    description: 'Find inner peace',
    keywords: ['mindfulness', 'meditation', 'mental', 'peace', 'calm', 'wellness'],
    companyPatterns: ['mindful', 'meditation', 'mental', 'wellness', 'peace']
  },
  {
    id: 'creativity',
    label: 'Creativity',
    icon: '🎨',
    color: 'bg-green-600 hover:bg-green-500',
    description: 'Express your creative side',
    keywords: ['creativity', 'art', 'design', 'creative', 'artistic', 'innovation'],
    companyPatterns: ['creative', 'art', 'design', 'studio', 'innovation']
  },
  {
    id: 'social',
    label: 'Social',
    icon: '👥',
    color: 'bg-yellow-600 hover:bg-yellow-500',
    description: 'Connect with others',
    keywords: ['social', 'community', 'networking', 'friends', 'connection'],
    companyPatterns: ['social', 'community', 'network', 'connect', 'together']
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: '💰',
    color: 'bg-indigo-600 hover:bg-indigo-500',
    description: 'Manage your money',
    keywords: ['finance', 'money', 'investment', 'trading', 'wealth', 'budget'],
    companyPatterns: ['finance', 'money', 'investment', 'trading', 'wealth', 'bank']
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    icon: '☀️',
    color: 'bg-red-600 hover:bg-red-500',
    description: 'Improve your daily life',
    keywords: ['lifestyle', 'daily', 'routine', 'habits', 'life', 'personal'],
    companyPatterns: ['lifestyle', 'life', 'daily', 'routine', 'personal']
  },
  {
    id: 'gaming',
    label: 'Gaming',
    icon: '🎮',
    color: 'bg-cyan-600 hover:bg-cyan-500',
    description: 'Level up your gaming',
    keywords: ['gaming', 'games', 'esports', 'stream', 'twitch', 'gaming'],
    companyPatterns: ['gaming', 'games', 'esports', 'stream', 'play']
  },
  {
    id: 'business',
    label: 'Business',
    icon: '📊',
    color: 'bg-slate-600 hover:bg-slate-500',
    description: 'Grow your business',
    keywords: ['business', 'entrepreneurship', 'startup', 'sales', 'marketing'],
    companyPatterns: ['business', 'startup', 'enterprise', 'sales', 'marketing']
  }
];

/**
 * Automatically categorize a challenge based on company info and challenge content
 */
export function categorizeChallenge(
  challengeTitle: string,
  challengeDescription: string | null,
  companyName: string | null,
  creatorName: string | null
): string {
  const content = `${challengeTitle} ${challengeDescription || ''} ${companyName || ''} ${creatorName || ''}`.toLowerCase();
  
  // Find best matching category
  for (const category of CHALLENGE_CATEGORIES) {
    // Check company patterns first (higher priority)
    if (companyName) {
      for (const pattern of category.companyPatterns) {
        if (companyName.toLowerCase().includes(pattern)) {
          return category.id;
        }
      }
    }
    
    // Check content keywords
    for (const keyword of category.keywords) {
      if (content.includes(keyword)) {
        return category.id;
      }
    }
  }
  
  return 'general'; // fallback
}

/**
 * Get category info by ID
 */
export function getCategoryById(categoryId: string): CategoryMapping | null {
  return CHALLENGE_CATEGORIES.find(cat => cat.id === categoryId) || null;
}

/**
 * Get all categories for UI
 */
export function getAllCategories(): CategoryMapping[] {
  return [
    {
      id: '',
      label: 'All Categories',
      icon: '🔍',
      color: 'bg-gray-700 hover:bg-gray-600',
      description: 'Browse all challenges',
      keywords: [],
      companyPatterns: []
    },
    ...CHALLENGE_CATEGORIES
  ];
}
