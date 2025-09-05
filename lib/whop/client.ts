// lib/whop/client.ts
// Using Whop REST API directly

const WHOP_API_BASE = 'https://api.whop.com/api/v2'

export interface WhopProduct {
  id: string;
  title: string;
  description?: string;
  price_amount: number;
  price_currency: string;
  type: 'one_time' | 'subscription';
  image_url?: string;
  checkout_url: string;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface WhopMembership {
  id: string;
  user_id: string;
  product_id: string;
  company_id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  valid: boolean;
  created_at: string;
  expires_at?: string;
}

export interface WhopUser {
  id: string;
  email: string;
  username?: string;
  profile_pic_url?: string;
  created_at: string;
}

export interface WhopCompany {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  created_at: string;
}

export class WhopIntegration {
  private apiKey: string;

  constructor() {
    if (!process.env.WHOP_API_KEY) {
      throw new Error('WHOP_API_KEY environment variable is required for production');
    }
    
    this.apiKey = process.env.WHOP_API_KEY;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${WHOP_API_BASE}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Whop API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // User Authentication & Access
  async validateUserMembership(userId: string, companyId: string): Promise<boolean> {
    try {
      const memberships = await this.makeRequest(`/memberships?user_id=${userId}&company_id=${companyId}&valid=true`);
      
      return memberships.data?.length > 0 || false;
    } catch (error) {
      console.error('Error validating user membership:', error);
      return false;
    }
  }

  async getUserMemberships(userId: string): Promise<WhopMembership[]> {
    try {
      const response = await this.makeRequest(`/memberships?user_id=${userId}&valid=true`);
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user memberships:', error);
      return [];
    }
  }

  // Product Management
  async getCompanyProducts(companyId: string): Promise<WhopProduct[]> {
    try {
      const response = await this.makeRequest(`/products?company_id=${companyId}&active=true`);
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching company products:', error);
      return [];
    }
  }

  async getProduct(productId: string): Promise<WhopProduct | null> {
    try {
      const product = await this.makeRequest(`/products/${productId}`);
      
      return product || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  async getCompany(companyId: string): Promise<WhopCompany | null> {
    try {
      const company = await this.makeRequest(`/companies/${companyId}`);
      
      return company || null;
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  }

  async getUser(userId: string): Promise<WhopUser | null> {
    try {
      const user = await this.makeRequest(`/users/${userId}`);
      
      return user || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  // Checkout & Payments
  async createCheckoutSession(params: {
    product_id: string;
    success_url: string;
    cancel_url: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string }> {
    try {
      const checkout = await this.makeRequest('/checkouts', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      
      return { url: checkout.url || '' };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Helper Methods for Challenge Integration
  async hasValidSubscription(userId: string, companyId: string): Promise<boolean> {
    return this.validateUserMembership(userId, companyId);
  }

  async isPremiumUser(userId: string, companyId: string): Promise<boolean> {
    try {
      const memberships = await this.getUserMemberships(userId);
      
      return memberships.some(membership => 
        membership.company_id === companyId &&
        membership.status === 'active' &&
        membership.valid
      );
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  async getUserTier(userId: string, companyId: string): Promise<'free' | 'premium' | 'enterprise'> {
    try {
      const isPremium = await this.isPremiumUser(userId, companyId);
      // For now, we'll just return premium or free
      // You can extend this logic based on your product structure
      return isPremium ? 'premium' : 'free';
    } catch (error) {
      console.error('Error getting user tier:', error);
      return 'free';
    }
  }

  // Analytics (if available in the API)
  async getRevenueAnalytics(companyId: string, period: string = '30d'): Promise<{
    total_amount: number;
    currency: string;
    transactions_count: number;
  }> {
    try {
      // Note: This endpoint might not be available in the public API
      // This is a placeholder implementation
      const response = await this.makeRequest(`/analytics/revenue?company_id=${companyId}&period=${period}`);
      
      return {
        total_amount: response.total_amount || 0,
        currency: response.currency || 'USD',
        transactions_count: response.transactions_count || 0,
      };
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      return {
        total_amount: 0,
        currency: 'USD',
        transactions_count: 0,
      };
    }
  }

  // WebSocket connection for real-time updates (placeholder)
  connectWebSocket(userId: string): void {
    // Placeholder for WebSocket implementation
    console.log('WebSocket connection placeholder for user:', userId);
  }

  // Validate license key (alternative authentication method)
  async validateLicenseKey(licenseKey: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/memberships/validate_license?license_key=${licenseKey}`);
      
      return response.valid || false;
    } catch (error) {
      console.error('Error validating license key:', error);
      return false;
    }
  }

  // Get membership by license key
  async getMembershipByLicense(licenseKey: string): Promise<WhopMembership | null> {
    try {
      const membership = await this.makeRequest(`/memberships/license/${licenseKey}`);
      
      return membership || null;
    } catch (error) {
      console.error('Error fetching membership by license:', error);
      return null;
    }
  }
}

// Singleton instance
let whopInstance: WhopIntegration | null = null;

export function getWhopIntegration(): WhopIntegration {
  if (!whopInstance) {
    whopInstance = new WhopIntegration();
  }
  return whopInstance;
}

// Export default instance
export default getWhopIntegration();
