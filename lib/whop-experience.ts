// lib/whop-experience.ts - Experience App specific helpers
"use server";
import { headers, cookies } from "next/headers";

export interface ExperienceContext {
  userId?: string;
  companyId?: string;
  membershipId?: string;
  experienceId?: string;
  isEmbedded: boolean;
}

export async function getExperienceContext(): Promise<ExperienceContext> {
  const h = await headers();
  const c = await cookies();
  
  // Method 1: Check headers for Experience Apps
  let userId = h.get('x-whop-user-id') || h.get('X-Whop-User-Id') || 
               h.get('x-user-id') || h.get('X-User-Id') || '';
                 
  let companyId = h.get('x-whop-company-id') || h.get('X-Whop-Company-Id') || 
                  h.get('x-company-id') || h.get('X-Company-Id') || '';
  
  // 🚨 CRITICAL: Validate company ID from headers immediately  
  if (companyId && (!companyId.startsWith('biz_') || companyId.length < 10)) {
    console.log('🚨 HEADER BLOCK: Invalid company ID format from headers, rejecting:', companyId);
    companyId = ''; // Clear invalid company ID from headers
  }
                    
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
        let extractedCompanyId = appConfig.did || '';
        
        // 🎯 NORMALIZE: Convert Whop internal company ID to standard format
        if (extractedCompanyId && !extractedCompanyId.startsWith('biz_')) {
          extractedCompanyId = `biz_${extractedCompanyId}`;
          console.log('🔄 Normalized company ID format:', extractedCompanyId);
        }
        
        // 🚨 CRITICAL: Validate company ID format after normalization
        if (extractedCompanyId && extractedCompanyId.startsWith('biz_') && extractedCompanyId.length > 10) {
          companyId = extractedCompanyId;
          console.log('✅ Valid company ID extracted from app config:', companyId);
        } else {
          console.log('🚨 BLOCKED: Invalid company ID format from app config:', extractedCompanyId);
        }
      } catch (error) {
        console.log('❌ Failed to parse app config:', error);
      }
    }
  }

  // 🚨 CRITICAL: Final validation - reject invalid company IDs
  if (companyId && (!companyId.startsWith('biz_') || companyId.length < 10)) {
    console.log('🚨 FINAL BLOCK: Invalid company ID format detected, rejecting:', companyId);
    companyId = ''; // Clear invalid company ID
  }

  // Check if we're running in an embedded context (iFrame)
  const referer = h.get('referer') || '';
  const userAgent = h.get('user-agent') || '';
  const isEmbedded = referer.includes('whop.com') || 
                     h.get('x-frame-options') !== null ||
                     userAgent.includes('WhopApp');

  const context: ExperienceContext = {
    userId: userId || undefined,
    companyId: companyId || undefined,
    membershipId: membershipId || undefined,
    experienceId: experienceId || undefined,
    isEmbedded
  };

  console.log('🖼️ Experience Context Enhanced:', {
    hasUserId: !!context.userId,
    userId: context.userId,
    hasCompanyId: !!context.companyId,
    companyId: context.companyId,
    hasMembershipId: !!context.membershipId,
    hasExperienceId: !!context.experienceId,
    isEmbedded: context.isEmbedded,
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
