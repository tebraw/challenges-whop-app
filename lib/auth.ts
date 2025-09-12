// lib/auth-new-clean.ts
// COMPLETELY NEW AUTH SYSTEM - NO FALLBACKS!

import { cookies, headers } from 'next/headers';
import { prisma } from './prisma';
import { autoCreateOrUpdateUser } from './auto-company-extraction';

export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  whopCompanyId: string | null;
  whopUserId: string | null;
  tenantId: string;
} | null> {
  
  console.log('🔍 NEW getCurrentUser() called - NO FALLBACKS ALLOWED');
  
  // DEV MODE: Return mock admin user for localhost testing
  if (process.env.NODE_ENV === 'development') {
    const headersList = await headers();
    const host = headersList.get('host');
    
    if (host && host.includes('localhost')) {
      console.log('🔧 DEV MODE: Using mock admin user for localhost');
      return {
        id: 'dev-user-id',
        email: 'user_eGf5vVjIuGLSy@whop.com',
        name: 'Dev Admin User',
        role: 'ADMIN',
        createdAt: new Date(),
        whopCompanyId: 'dev-company-id',
        whopUserId: 'user_eGf5vVjIuGLSy',
        tenantId: 'dev-company-id'
      };
    }
  }
  
  try {
    // Get headers
    const headersList = await headers();
    const experienceId = headersList.get('x-whop-experience-id');
    const headerCompanyId = headersList.get('x-whop-company-id');
    const whopUserId = headersList.get('x-whop-user-id') || headersList.get('x-user-id');
    const userToken = headersList.get('x-whop-user-token');
    
    console.log('📊 Auth Headers:', {
      experienceId: experienceId || 'NONE',
      headerCompanyId: headerCompanyId || 'NONE', 
      whopUserId: whopUserId || 'NONE',
      hasUserToken: !!userToken
    });
    
    if (!whopUserId) {
      console.log('❌ No Whop User ID found in headers');
      return null;
    }
    
    // 🎯 Use the clean auto-creation system - NO FALLBACKS!
    try {
      const user = await autoCreateOrUpdateUser(whopUserId, experienceId, headerCompanyId);
      console.log('✅ User authenticated via NEW SYSTEM:', {
        email: user.email,
        role: user.role,
        companyId: user.whopCompanyId
      });
      return user;
    } catch (autoCreateError) {
      console.error('❌ Auto-creation failed:', autoCreateError);
      
      // Only fallback: Try to find existing user (no creation with fallback values!)
      const existingUser = await prisma.user.findUnique({
        where: { whopUserId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          whopCompanyId: true,
          whopUserId: true,
          tenantId: true
        }
      });
      
      if (existingUser) {
        console.log('✅ Found existing user:', existingUser.email);
        return existingUser;
      }
      
      console.log('❌ Cannot create or find user - NO FALLBACK CREATION!');
      return null;
    }
    
  } catch (error) {
    console.error('❌ NEW getCurrentUser() error:', error);
    return null;
  }
}

// Helper functions for backward compatibility
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'ADMIN';
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
}