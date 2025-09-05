"use server";
import { headers } from "next/headers";
import { whopSdk } from "./whop-sdk";

interface WhopAuthUser {
  userId: string;
  user?: any;
  memberships?: any[];
  companyId?: string;
}

export async function getWhopUserFromHeaders(): Promise<WhopAuthUser | null> {
  const h = await headers();
  
  try {
    // Try new SDK method first - verifyUserToken with headers
    const tokenResult = await whopSdk.verifyUserToken(h);
    
    if (tokenResult.userId) {
      // Success with new SDK
      const user = await whopSdk.users.getUser({ userId: tokenResult.userId }).catch(() => null);
      
      return {
        userId: tokenResult.userId,
        user: user,
        companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      };
    }
  } catch (error) {
    console.log('New SDK method failed, trying fallback:', error);
  }
  
  // Fallback: Manual header extraction
  const authHeader = h.get('authorization') || h.get('Authorization') || '';
  const whopToken = h.get('x-whop-token') || h.get('X-Whop-Token') || '';
  const whopUserId = h.get('x-whop-user-id') || h.get('X-Whop-User-Id') || 
                    h.get('x-whop-userid') || h.get('X-Whop-UserId') || '';
  const whopCompanyId = h.get('x-whop-company-id') || h.get('X-Whop-Company-Id') || '';
  
  console.log('🔍 Experience App headers received:', {
    hasAuth: !!authHeader,
    hasToken: !!whopToken,
    hasUserId: !!whopUserId,
    hasCompanyId: !!whopCompanyId,
    userId: whopUserId?.slice(-6) || 'none',
    companyId: whopCompanyId?.slice(-6) || 'none'
  });
  
  // If we have userId directly from headers (Experience App style)
  if (whopUserId) {
    try {
      const user = await whopSdk.users.getUser({ userId: whopUserId }).catch(() => null);
      
      return {
        userId: whopUserId,
        user: user,
        companyId: whopCompanyId || process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      };
    } catch (error) {
      console.log('Direct userId method failed:', error);
    }
  }
  
  // If we have a token, try to verify it manually
  if (authHeader || whopToken) {
    const token = authHeader.replace('Bearer ', '') || whopToken;
    
    try {
      // Try with simple token string
      const tokenResult = await whopSdk.verifyUserToken(token);
      
      if (tokenResult.userId) {
        const user = await whopSdk.users.getUser({ userId: tokenResult.userId }).catch(() => null);
        
        return {
          userId: tokenResult.userId,
          user: user,
          companyId: whopCompanyId || process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
        };
      }
    } catch (error) {
      console.log('Token verification failed:', error);
    }
  }
  
  console.log('All Whop authentication methods failed');
  return null;
}

// Legacy compatibility exports
export async function getCurrentUser(): Promise<WhopAuthUser | null> {
  return getWhopUserFromHeaders();
}
