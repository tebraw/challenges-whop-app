// lib/whop-experience-fixed.ts - Corrected Experience Context
"use server";
import { headers, cookies } from "next/headers";

export interface FixedExperienceContext {
  userId?: string;
  experienceId?: string;       // ✅ PRIMARY: This is the isolation boundary
  companyId?: string;          // ✅ SECONDARY: For admin checks
  membershipId?: string;
  isEmbedded: boolean;
  accessLevel?: 'admin' | 'customer' | 'no_access';
}

/**
 * ✅ CORRECT: Get Experience Context with proper isolation
 * This replaces our company-based approach with experience-based isolation
 */
export async function getFixedExperienceContext(): Promise<FixedExperienceContext> {
  const h = await headers();
  const c = await cookies();
  
  // Priority 1: Extract from Whop headers (embedded apps)
  const experienceId = h.get('x-whop-experience-id') || 
                      h.get('X-Whop-Experience-Id') || 
                      h.get('x-experience-id') || 
                      h.get('X-Experience-Id') || '';

  let userId = h.get('x-whop-user-id') || h.get('X-Whop-User-Id') || 
               h.get('x-user-id') || h.get('X-User-Id') || '';
                 
  let companyId = h.get('x-whop-company-id') || h.get('X-Whop-Company-Id') || 
                  h.get('x-company-id') || h.get('X-Company-Id') || '';

  // Priority 2: Extract from JWT token if headers missing
  if (!userId) {
    const whopUserToken = h.get('x-whop-user-token') || c.get('whop_user_token')?.value;
    if (whopUserToken) {
      try {
        const payload = JSON.parse(atob(whopUserToken.split('.')[1]));
        userId = userId || payload.sub || '';
        console.log('🔍 Extracted from token - User:', userId);
      } catch (error) {
        console.log('❌ Failed to parse Whop user token:', error);
      }
    }
  }

  // Priority 3: Check URL params for experienceId (fallback)
  if (!experienceId) {
    const referer = h.get('referer') || '';
    const experienceMatch = referer.match(/\/experiences\/([^\/\?]+)/);
    if (experienceMatch) {
      const extractedId = experienceMatch[1];
      console.log('🔍 Extracted experienceId from URL:', extractedId);
      return { 
        userId, 
        experienceId: extractedId, 
        companyId, 
        isEmbedded: true 
      };
    }
  }

  // Check if embedded
  const referer = h.get('referer') || '';
  const isEmbedded = referer.includes('whop.com') || 
                     h.get('x-frame-options') !== null;

  const context: FixedExperienceContext = {
    userId: userId || undefined,
    experienceId: experienceId || undefined,  // ✅ This is the key isolation field
    companyId: companyId || undefined,
    isEmbedded
  };

  console.log('🖼️ Fixed Experience Context:', {
    hasUserId: !!context.userId,
    hasExperienceId: !!context.experienceId,    // ✅ Most important
    hasCompanyId: !!context.companyId,
    isEmbedded: context.isEmbedded,
    method: 'fixed-experience-isolation'
  });

  return context;
}

/**
 * ✅ CORRECT: Require Experience Context (with proper validation)
 */
export async function requireFixedExperienceContext(): Promise<FixedExperienceContext> {
  const context = await getFixedExperienceContext();
  
  if (!context.userId) {
    throw new Error('Experience context required - no user ID found');
  }
  
  if (!context.experienceId) {
    throw new Error('Experience context required - no experience ID found');
  }
  
  return context;
}

/**
 * ✅ CORRECT: Get or Create Tenant by Experience ID (not company ID)
 */
export async function getOrCreateExperienceTenant(experienceId: string, companyId?: string) {
  const { prisma } = await import('@/lib/prisma');
  
  // Look for existing tenant by experienceId
  let tenant = await prisma.tenant.findFirst({
    where: { whopExperienceId: experienceId }
  });
  
  if (!tenant) {
    // Create new tenant for this experience
    tenant = await prisma.tenant.create({
      data: {
        name: `Experience ${experienceId.slice(-6)}`,
        whopExperienceId: experienceId,
        whopCompanyId: companyId || null
      }
    });
    console.log(`🆕 Created experience tenant: ${tenant.id} for experience: ${experienceId}`);
  }
  
  return tenant;
}

/**
 * ✅ CORRECT: Check Experience Access (not company access)
 */
export async function checkExperienceAccess(userId: string, experienceId: string) {
  try {
    const { whopSdk } = await import('@/lib/whop-sdk');
    
    const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId
    });
    
    return {
      hasAccess: accessResult.hasAccess,
      accessLevel: accessResult.accessLevel as 'admin' | 'customer' | 'no_access',
      isAdmin: accessResult.accessLevel === 'admin'
    };
  } catch (error) {
    console.error('❌ Experience access check failed:', error);
    return {
      hasAccess: false,
      accessLevel: 'no_access' as const,
      isAdmin: false
    };
  }
}
