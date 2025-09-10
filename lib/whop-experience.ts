// lib/whop-experience.ts - Experience App specific helpers
"use server";
import { headers, cookies } from "next/headers";

export interface ExperienceContext {
  userId?: string;
  companyId?: string;
  membershipId?: string;
  experienceId?: string;
  isEmbedded: boolean;
  isCompanyOwner?: boolean; // Add this field to detect company owner context
}

export async function getExperienceContext(): Promise<ExperienceContext> {
  const h = await headers();
  const c = await cookies();
  
  // Method 1: Check headers for Experience Apps
  let userId = h.get('x-whop-user-id') || h.get('X-Whop-User-Id') || 
               h.get('x-user-id') || h.get('X-User-Id') || '';
                 
  let companyId = h.get('x-whop-company-id') || h.get('X-Whop-Company-Id') || 
                  h.get('x-company-id') || h.get('X-Company-Id') || '';
                    
  const membershipId = h.get('x-whop-membership-id') || h.get('X-Whop-Membership-Id') || 
                       h.get('x-membership-id') || h.get('X-Membership-Id') || '';
                       
  const experienceId = h.get('x-whop-experience-id') || h.get('X-Whop-Experience-Id') || 
                       h.get('x-experience-id') || h.get('X-Experience-Id') || '';

  // Method 2: Parse from Whop User Token if headers are missing
  if (!userId) {
    const whopUserToken = h.get('x-whop-user-token') || c.get('whop_user_token')?.value;
    if (whopUserToken) {
      try {
        // Decode JWT payload (without verification for extraction)
        const payload = JSON.parse(atob(whopUserToken.split('.')[1]));
        userId = payload.sub || '';
        console.log('🔍 Extracted user from token:', userId);
      } catch (error) {
        console.log('❌ Failed to parse Whop user token:', error);
      }
    }
  }

  // Method 3: Extract from app config if available
  if (!companyId) {
    const appConfigCookie = c.get('whop.app-config')?.value;
    if (appConfigCookie) {
      try {
        const appConfig = JSON.parse(atob(appConfigCookie.split('.')[1]));
        companyId = appConfig.did || ''; // Company ID in app config
        console.log('🔍 Extracted company from app config:', companyId);
      } catch (error) {
        console.log('❌ Failed to parse app config:', error);
      }
    }
  }

  // Check if we're running in an embedded context (iFrame)
  const referer = h.get('referer') || '';
  const userAgent = h.get('user-agent') || '';
  const isEmbedded = referer.includes('whop.com') || 
                     h.get('x-frame-options') !== null ||
                     userAgent.includes('WhopApp');

  // Check for company owner context clues
  // When a company owner accesses their own app, they usually have the right context
  let isCompanyOwner = false;
  
  // If we have both userId and companyId from Whop headers and we're embedded, 
  // this is likely a company owner accessing their own app
  if (userId && companyId && isEmbedded) {
    // Additional checks: look for admin access patterns
    const hasAdminAccess = h.get('x-whop-access-level') === 'admin' ||
                          h.get('x-whop-role') === 'admin' ||
                          referer.includes('dashboard') ||
                          referer.includes('admin');
    
    // If accessing admin route with proper context, likely company owner
    isCompanyOwner = hasAdminAccess;
    console.log('🔍 Company owner detection:', { hasAdminAccess, isCompanyOwner });
  }

  const context: ExperienceContext = {
    userId: userId || undefined,
    companyId: companyId || undefined,
    membershipId: membershipId || undefined,
    experienceId: experienceId || undefined,
    isEmbedded,
    isCompanyOwner
  };

  console.log('🖼️ Experience Context Enhanced:', {
    hasUserId: !!context.userId,
    userId: context.userId,
    hasCompanyId: !!context.companyId,
    companyId: context.companyId,
    hasMembershipId: !!context.membershipId,
    hasExperienceId: !!context.experienceId,
    isEmbedded: context.isEmbedded,
    isCompanyOwner: context.isCompanyOwner,
    refererDomain: referer ? new URL(referer).hostname : 'none',
    method: userId ? (h.get('x-whop-user-token') ? 'header' : 'token') : 'none'
  });

  return context;
}

export async function requireExperienceContext(): Promise<ExperienceContext> {
  const context = await getExperienceContext();
  
  if (!context.userId) {
    throw new Error('Experience App context required - no user ID found in headers');
  }
  
  if (!context.companyId) {
    throw new Error('Experience App context required - no company ID found in headers');
  }
  
  return context;
}
