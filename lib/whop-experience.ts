// lib/whop-experience.ts - Experience App specific helpers
"use server";
import { headers } from "next/headers";

export interface ExperienceContext {
  userId?: string;
  companyId?: string;
  membershipId?: string;
  experienceId?: string;
  isEmbedded: boolean;
}

export async function getExperienceContext(): Promise<ExperienceContext> {
  const h = await headers();
  
  // Check all possible header variants for Experience Apps
  const userId = h.get('x-whop-user-id') || h.get('X-Whop-User-Id') || 
                 h.get('x-user-id') || h.get('X-User-Id') || '';
                 
  const companyId = h.get('x-whop-company-id') || h.get('X-Whop-Company-Id') || 
                    h.get('x-company-id') || h.get('X-Company-Id') || '';
                    
  const membershipId = h.get('x-whop-membership-id') || h.get('X-Whop-Membership-Id') || 
                       h.get('x-membership-id') || h.get('X-Membership-Id') || '';
                       
  const experienceId = h.get('x-whop-experience-id') || h.get('X-Whop-Experience-Id') || 
                       h.get('x-experience-id') || h.get('X-Experience-Id') || '';

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

  console.log('🖼️ Experience Context:', {
    hasUserId: !!context.userId,
    hasCompanyId: !!context.companyId,
    hasMembershipId: !!context.membershipId,
    hasExperienceId: !!context.experienceId,
    isEmbedded: context.isEmbedded,
    refererDomain: referer ? new URL(referer).hostname : 'none'
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
