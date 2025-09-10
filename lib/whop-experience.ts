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
  
  // Method 1: Check ALL possible header variations for Experience Apps
  // Official Whop headers (most common)
  let userId = h.get('whop-user-id') || h.get('Whop-User-Id') ||
               // X- prefixed variants
               h.get('x-whop-user-id') || h.get('X-Whop-User-Id') || 
               // Underscore variants
               h.get('whop_user_id') || h.get('WHOP_USER_ID') ||
               // Generic variants
               h.get('x-user-id') || h.get('X-User-Id') || 
               h.get('user-id') || h.get('User-Id') || '';
                 
  let companyId = h.get('whop-company-id') || h.get('Whop-Company-Id') ||
                  // X- prefixed variants
                  h.get('x-whop-company-id') || h.get('X-Whop-Company-Id') || 
                  // Underscore variants
                  h.get('whop_company_id') || h.get('WHOP_COMPANY_ID') ||
                  // Generic variants
                  h.get('x-company-id') || h.get('X-Company-Id') ||
                  h.get('company-id') || h.get('Company-Id') || '';
                    
  const membershipId = h.get('whop-membership-id') || h.get('Whop-Membership-Id') ||
                       h.get('x-whop-membership-id') || h.get('X-Whop-Membership-Id') || 
                       h.get('whop_membership_id') || h.get('WHOP_MEMBERSHIP_ID') ||
                       h.get('x-membership-id') || h.get('X-Membership-Id') ||
                       h.get('membership-id') || h.get('Membership-Id') || '';
                       
  const experienceId = h.get('whop-experience-id') || h.get('Whop-Experience-Id') ||
                       h.get('x-whop-experience-id') || h.get('X-Whop-Experience-Id') || 
                       h.get('whop_experience_id') || h.get('WHOP_EXPERIENCE_ID') ||
                       h.get('x-experience-id') || h.get('X-Experience-Id') ||
                       h.get('experience-id') || h.get('Experience-Id') || '';

  // Method 2: Parse from Whop User Token if headers are missing
  if (!userId) {
    const whopUserToken = h.get('whop-user-token') || h.get('Whop-User-Token') ||
                         h.get('x-whop-user-token') || h.get('X-Whop-User-Token') ||
                         h.get('whop_user_token') || h.get('WHOP_USER_TOKEN') ||
                         h.get('authorization')?.replace('Bearer ', '') ||
                         c.get('whop_user_token')?.value ||
                         c.get('whop-user-token')?.value;
                         
    if (whopUserToken) {
      try {
        // Decode JWT payload (without verification for extraction)
        const payload = JSON.parse(atob(whopUserToken.split('.')[1]));
        userId = payload.sub || payload.userId || payload.user_id || '';
        
        // Also try to extract company from token
        if (!companyId) {
          companyId = payload.companyId || payload.company_id || payload.did || '';
        }
        
        console.log('🔍 Extracted from token - User:', userId, 'Company:', companyId);
      } catch (error) {
        console.log('❌ Failed to parse Whop user token:', error);
      }
    }
  }

  // Method 3: Extract from app config if available
  if (!companyId) {
    const appConfigCookie = c.get('whop.app-config')?.value || 
                           c.get('whop_app_config')?.value ||
                           c.get('whop-app-config')?.value;
                           
    if (appConfigCookie) {
      try {
        const appConfig = JSON.parse(atob(appConfigCookie.split('.')[1]));
        companyId = appConfig.did || appConfig.companyId || appConfig.company_id || ''; 
        console.log('🔍 Extracted company from app config:', companyId);
      } catch (error) {
        console.log('❌ Failed to parse app config:', error);
      }
    }
  }

  // Method 4: Extract from URL parameters (for iframe embedding)
  const referer = h.get('referer') || '';
  if ((!userId || !companyId) && referer) {
    try {
      const refererUrl = new URL(referer);
      const searchParams = refererUrl.searchParams;
      
      if (!userId) {
        userId = searchParams.get('user') || searchParams.get('userId') || 
                searchParams.get('user_id') || searchParams.get('whop_user_id') || '';
      }
      
      if (!companyId) {
        companyId = searchParams.get('company') || searchParams.get('companyId') || 
                   searchParams.get('company_id') || searchParams.get('whop_company_id') || '';
      }
      
      if (userId || companyId) {
        console.log('🔍 Extracted from URL params - User:', userId, 'Company:', companyId);
      }
    } catch (error) {
      // Ignore URL parsing errors
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
  
  // Method 1: Check explicit admin/owner headers
  const accessLevel = h.get('whop-access-level') || h.get('Whop-Access-Level') ||
                     h.get('x-whop-access-level') || h.get('X-Whop-Access-Level') ||
                     h.get('whop_access_level') || h.get('WHOP_ACCESS_LEVEL') ||
                     h.get('access-level') || h.get('Access-Level') || '';
                     
  const role = h.get('whop-role') || h.get('Whop-Role') ||
              h.get('x-whop-role') || h.get('X-Whop-Role') ||
              h.get('whop_role') || h.get('WHOP_ROLE') ||
              h.get('role') || h.get('Role') || '';
  
  // If we have both userId and companyId from Whop headers and we're embedded, 
  // this is likely a company owner accessing their own app
  if (userId && companyId && isEmbedded) {
    // Additional checks: look for admin access patterns
    const hasAdminAccess = accessLevel === 'admin' ||
                          role === 'admin' ||
                          role === 'owner' ||
                          accessLevel === 'owner' ||
                          referer.includes('dashboard') ||
                          referer.includes('admin');
    
    // If accessing admin route with proper context, likely company owner
    isCompanyOwner = hasAdminAccess;
    console.log('🔍 Company owner detection:', { 
      hasAdminAccess, 
      isCompanyOwner, 
      accessLevel, 
      role,
      refererIncludes: {
        dashboard: referer.includes('dashboard'),
        admin: referer.includes('admin')
      }
    });
  }

  // Method 2: Fallback Company Owner Detection
  // If user accesses their own company (matching NEXT_PUBLIC_WHOP_COMPANY_ID), they're the owner
  if (!isCompanyOwner && userId && companyId) {
    const configuredCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
    
    if (configuredCompanyId && companyId === configuredCompanyId) {
      console.log('🔍 FALLBACK: User accessing their configured company - assuming owner');
      isCompanyOwner = true;
    }
  }
  
  // Method 3: Ultra-fallback for testing
  // If we have valid Whop context but no explicit owner detection, and we're in an embedded iframe,
  // assume company owner for now (this helps with testing)
  if (!isCompanyOwner && userId && companyId && isEmbedded && 
      (referer.includes('whop.com') || referer.includes('dashboard'))) {
    console.log('🔍 ULTRA-FALLBACK: Valid Whop context in embedded iframe - assuming owner for testing');
    isCompanyOwner = true;
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
    userId: context.userId?.substring(0, 12) + '...',  // Don't log full IDs
    hasCompanyId: !!context.companyId,
    companyId: context.companyId?.substring(0, 12) + '...',
    hasMembershipId: !!context.membershipId,
    hasExperienceId: !!context.experienceId,
    isEmbedded: context.isEmbedded,
    isCompanyOwner: context.isCompanyOwner,
    refererDomain: referer ? new URL(referer).hostname : 'none',
    extractionMethod: userId ? 
      (h.get('whop-user-id') || h.get('x-whop-user-id') ? 'direct-header' : 
       h.get('whop-user-token') || h.get('x-whop-user-token') ? 'token' : 'url-params') : 'none',
    detectedHeaders: {
      hasWhopUserToken: !!(h.get('whop-user-token') || h.get('x-whop-user-token')),
      hasAccessLevel: !!(h.get('whop-access-level') || h.get('x-whop-access-level')),
      hasRole: !!(h.get('whop-role') || h.get('x-whop-role')),
      refererHost: referer ? new URL(referer).hostname : 'none'
    }
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
