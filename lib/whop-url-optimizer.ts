/**
 * 🚀 WHOP URL OPTIMIZATION UTILITIES
 * 
 * Optimizes Whop community URLs for better user experience
 * Based on analysis of whop.com/discover/appmafia/?productId=... pattern
 */

interface WhopUrlOptions {
  whopCompanyId?: string;
  whopHandle?: string;
  whopProductId?: string;
  tenantName?: string;
}

/**
 * Generates optimized Whop community URLs
 * Falls back gracefully from handle-based to ID-based URLs
 * Updated to match whop.com/appmafia/?productId=... pattern (no /discover/)
 */
export function generateWhopCommunityUrl(options: WhopUrlOptions): string {
  const { whopCompanyId, whopHandle, whopProductId, tenantName } = options;

  // Priority 1: Handle + Product ID (like your AppMafia example)
  if (whopHandle && whopProductId) {
    return `https://whop.com/${whopHandle}/?productId=${whopProductId}`;
  }

  // Priority 2: Handle only (clean direct URL)
  if (whopHandle) {
    return `https://whop.com/${whopHandle}`;
  }

  // Priority 3: Company ID (current method)
  if (whopCompanyId) {
    return `https://whop.com/company/${whopCompanyId}`;
  }

  // Fallback: Main Whop page
  return 'https://whop.com';
}

/**
 * Attempts to extract company handle from company ID or name
 * This is a heuristic approach until we can fetch handles from Whop API
 */
export function inferWhopHandle(tenantName?: string, companyId?: string): string | null {
  if (!tenantName && !companyId) return null;

  // Try to create a handle from tenant name
  if (tenantName) {
    const handle = tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special characters
      .slice(0, 20); // Keep reasonable length
    
    if (handle.length >= 3) {
      return handle;
    }
  }

  // Try to extract from company ID if it contains readable parts
  if (companyId && companyId.includes('_')) {
    const parts = companyId.split('_');
    if (parts.length > 1) {
      const possibleHandle = parts[1];
      if (possibleHandle.length >= 3 && /^[a-zA-Z]/.test(possibleHandle)) {
        return possibleHandle.toLowerCase();
      }
    }
  }

  return null;
}

/**
 * Generates user-friendly join confirmation message
 */
export function generateJoinMessage(tenantName: string, isOptimizedUrl: boolean): string {
  const urlType = isOptimizedUrl ? 'community page' : 'community';
  
  return `To join this challenge, you need to become a member of ${tenantName || 'this community'}.\n\nClick OK to visit the ${urlType} and join, or Cancel to stay here.`;
}

/**
 * Gets the best available Whop URL with enhanced UX
 */
export function getOptimizedWhopUrl(tenant: {
  name?: string;
  whopCompanyId?: string;
}): {
  url: string;
  isOptimized: boolean;
  type: 'handle' | 'company' | 'fallback';
} {
  const inferredHandle = inferWhopHandle(tenant.name, tenant.whopCompanyId);
  
  if (inferredHandle) {
    return {
      url: `https://whop.com/${inferredHandle}`,
      isOptimized: true,
      type: 'handle'
    };
  }
  
  if (tenant.whopCompanyId) {
    return {
      url: `https://whop.com/company/${tenant.whopCompanyId}`,
      isOptimized: false,
      type: 'company'
    };
  }
  
  return {
    url: 'https://whop.com',
    isOptimized: false,
    type: 'fallback'
  };
}

/**
 * Enhanced challenge sharing URLs for better SEO and UX
 * Updated to remove /discover/ prefix for cleaner URLs
 */
export function generateChallengeDiscoverUrl(
  challengeId: string, 
  tenant: { name?: string; whopCompanyId?: string }
): string {
  const inferredHandle = inferWhopHandle(tenant.name, tenant.whopCompanyId);
  
  if (inferredHandle) {
    return `/company/${inferredHandle}/c/${challengeId}`;
  }
  
  return `/discover/c/${challengeId}`; // Current format as fallback
}

/**
 * Analytics helper to track URL optimization success
 */
export function trackUrlOptimization(
  urlType: 'handle' | 'company' | 'fallback',
  tenantId: string
): void {
  // Log for analytics - can be enhanced with actual tracking service
  console.log('🔗 URL Optimization:', {
    type: urlType,
    tenantId,
    timestamp: new Date().toISOString(),
    optimized: urlType === 'handle'
  });
}