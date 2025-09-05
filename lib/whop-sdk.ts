// Real Whop SDK Implementation
// Documentation: https://dev.whop.com/api-reference

interface WhopUser {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
}

interface WhopProduct {
  id: string;
  title: string;
  description?: string;
  visibility: 'visible' | 'hidden';
  experiences: string[];
}

interface WhopExperience {
  id: string;
  name: string;
  product_id: string;
  configuration: {
    url: string;
    iframe_resizer_enabled: boolean;
  };
}

interface WhopMembership {
  id: string;
  user_id: string;
  product_id: string;
  status: 'active' | 'cancelled' | 'past_due';
  created_at: string;
}

class WhopSDK {
  private apiKey: string;
  private baseUrl = 'https://api.whop.com/api/v5';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Whop API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // User Management
  async getUser(userId: string): Promise<WhopUser> {
    return this.makeRequest(`/users/${userId}`);
  }

  async verifyUserToken(token: string): Promise<{ valid: boolean; user?: WhopUser }> {
    try {
      // Extract Bearer token if present
      const cleanToken = token.replace('Bearer ', '');
      
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const user = await response.json();
        return { valid: true, user };
      }
      
      return { valid: false };
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false };
    }
  }

  // Product Management
  async listProducts(): Promise<WhopProduct[]> {
    const response = await this.makeRequest('/products');
    return response.data || [];
  }

  async getProduct(productId: string): Promise<WhopProduct> {
    return this.makeRequest(`/products/${productId}`);
  }

  async createProduct(data: Partial<WhopProduct>): Promise<WhopProduct> {
    return this.makeRequest('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Experience Management
  async listExperiences(productId?: string): Promise<WhopExperience[]> {
    const endpoint = productId ? `/products/${productId}/experiences` : '/experiences';
    const response = await this.makeRequest(endpoint);
    return response.data || [];
  }

  async getExperience(experienceId: string): Promise<WhopExperience> {
    return this.makeRequest(`/experiences/${experienceId}`);
  }

  async createExperience(productId: string, data: Partial<WhopExperience>): Promise<WhopExperience> {
    return this.makeRequest(`/products/${productId}/experiences`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExperience(experienceId: string, data: Partial<WhopExperience>): Promise<WhopExperience> {
    return this.makeRequest(`/experiences/${experienceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Membership Management
  async getUserMemberships(userId: string): Promise<WhopMembership[]> {
    const response = await this.makeRequest(`/users/${userId}/memberships`);
    return response.data || [];
  }

  async getProductMemberships(productId: string): Promise<WhopMembership[]> {
    const response = await this.makeRequest(`/products/${productId}/memberships`);
    return response.data || [];
  }

  // Webhook Validation
  async validateWebhook(payload: string, signature: string, secret: string): Promise<boolean> {
    const crypto = require('crypto');
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  }
}

// Initialize SDK with environment variable
const getWhopSDK = (): WhopSDK | null => {
  const apiKey = process.env.WHOP_API_KEY;
  
  if (!apiKey) {
    console.warn('WHOP_API_KEY not found in environment variables');
    return null;
  }
  
  return new WhopSDK(apiKey);
};

// Export SDK instance and utility functions
export const whopSdk = getWhopSDK();

// Legacy compatibility functions (with fallbacks) - these can be server functions
export async function verifyUserToken(token: string) {
  "use server";
  
  if (!whopSdk) {
    // Fallback for development
    console.warn('Whop SDK not initialized - using fallback');
    
    // Check if we have a test token or user
    if (token && token.includes('test')) {
      return { 
        valid: true, 
        userId: 'test-user-123',
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          username: 'testuser',
          created_at: new Date().toISOString()
        }
      };
    }
    
    return { valid: false, userId: null };
  }

  try {
    const result = await whopSdk.verifyUserToken(token);
    return {
      valid: result.valid,
      userId: result.user?.id || null,
      user: result.user
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return { valid: false, userId: null };
  }
}

export async function validateWebhook(request: Request) {
  "use server";
  
  if (!whopSdk) {
    console.warn('Whop SDK not initialized - webhook validation skipped');
    return { event: null, data: null };
  }

  try {
    const payload = await request.text();
    const signature = request.headers.get('x-whop-signature') || '';
    const secret = process.env.WHOP_WEBHOOK_SECRET || '';

    const isValid = await whopSdk.validateWebhook(payload, signature, secret);
    
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    const data = JSON.parse(payload);
    return { event: data.type, data: data.data };
  } catch (error) {
    console.error('Webhook validation error:', error);
    return { event: null, data: null };
  }
}

// Export types for use in other files
export type { WhopUser, WhopProduct, WhopExperience, WhopMembership };
