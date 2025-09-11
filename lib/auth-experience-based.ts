// lib/auth-experience-based.ts - Corrected Experience-Based Authentication
import { cookies, headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { getFixedExperienceContext, checkExperienceAccess, getOrCreateExperienceTenant } from './whop-experience-fixed';

const prisma = new PrismaClient();

export interface ExperienceUser {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  tenantId: string;
  experienceId?: string;  // ✅ NEW: Experience-specific user context
  whopUserId: string | null;
  whopCompanyId: string | null;
}

/**
 * ✅ CORRECT: Experience-based Authentication
 * This replaces getCurrentUser() with proper Experience isolation
 */
export async function getCurrentExperienceUser(): Promise<ExperienceUser | null> {
  try {
    // 1. Get Experience Context (PRIMARY)
    const experienceContext = await getFixedExperienceContext();
    
    if (!experienceContext.userId || !experienceContext.experienceId) {
      console.log('❌ No valid experience context found');
      return null;
    }

    const { userId, experienceId, companyId } = experienceContext;
    
    // 2. Check Experience Access using official Whop SDK
    const accessResult = await checkExperienceAccess(userId, experienceId);
    
    if (!accessResult.hasAccess) {
      console.log('❌ User has no access to this experience');
      return null;
    }

    // 3. Get or create tenant for this experience
    const tenant = await getOrCreateExperienceTenant(experienceId, companyId);
    
    // 4. Find existing user by whopUserId and experienceId
    let user = await prisma.user.findFirst({
      where: { 
        whopUserId: userId,
        tenantId: tenant.id  // User must be in the correct experience tenant
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        tenantId: true,
        whopUserId: true,
        whopCompanyId: true
      }
    });

    // 5. Create user if not exists
    if (!user) {
      const isAdmin = accessResult.isAdmin;
      
      user = await prisma.user.create({
        data: {
          email: `experience_${userId.slice(-6)}@whop.com`,
          name: `Experience User ${userId.slice(-6)}`,
          role: isAdmin ? 'ADMIN' : 'USER',
          whopUserId: userId,
          whopCompanyId: companyId || null,
          tenantId: tenant.id
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          tenantId: true,
          whopUserId: true,
          whopCompanyId: true
        }
      });
      
      console.log(`✅ Created experience user: ${user.email} (${user.role}) for experience: ${experienceId}`);
    } else {
      // Update role if access level changed
      const correctRole = accessResult.isAdmin ? 'ADMIN' : 'USER';
      if (user.role !== correctRole) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: correctRole },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            tenantId: true,
            whopUserId: true,
            whopCompanyId: true
          }
        });
        console.log(`✅ Updated user role to: ${correctRole} for experience: ${experienceId}`);
      }
    }

    return {
      ...user,
      experienceId  // ✅ Include experience context
    };

  } catch (error) {
    console.error('❌ Experience authentication failed:', error);
    return null;
  }
}

/**
 * ✅ CORRECT: Experience-based Admin Check
 */
export async function isExperienceAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentExperienceUser();
    if (!user) return false;
    
    // Must have ADMIN role AND valid experience context
    return user.role === 'ADMIN' && !!user.experienceId;
  } catch {
    return false;
  }
}

/**
 * ✅ CORRECT: Require Experience Admin Access
 */
export async function requireExperienceAdmin(): Promise<ExperienceUser> {
  const user = await getCurrentExperienceUser();
  
  if (!user) {
    throw new Error('Experience authentication required');
  }
  
  if (user.role !== 'ADMIN') {
    throw new Error('Experience admin access required');
  }
  
  return user;
}

/**
 * ✅ CORRECT: Get Current Experience ID
 */
export async function getCurrentExperienceId(): Promise<string | null> {
  try {
    const context = await getFixedExperienceContext();
    return context.experienceId || null;
  } catch {
    return null;
  }
}

/**
 * ✅ CORRECT: Get User's Experience Tenant
 */
export async function getCurrentExperienceTenant() {
  const user = await getCurrentExperienceUser();
  if (!user) {
    throw new Error('No authenticated user for experience');
  }
  
  return await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    include: {
      challenges: true,
      users: true
    }
  });
}
