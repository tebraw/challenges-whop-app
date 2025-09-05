// lib/auth.ts - Admin Security Helper
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { isDevAdmin, getDevUser } from './devAuth';
import { getWhopSession } from './whop/auth';

const prisma = new PrismaClient();

export async function isAdmin(): Promise<boolean> {
  try {
    // SECURITY: Disable development mode in production
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_AUTH === 'true') {
      return await isDevAdmin();
    }
    
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;
    
    // PRODUCTION SECURITY: Only the app installer (company owner) is admin
    // Must have ADMIN role AND valid Whop company ID
    return currentUser.role === 'ADMIN' && !!currentUser.whopCompanyId;
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    throw new Error('Admin access required');
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    
    // SECURITY: Only allow dev auth if explicitly enabled
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_AUTH === 'true') {
      const testUserId = cookieStore.get('as')?.value;
      if (testUserId) return testUserId;
    }
    
    // PRODUCTION: Use Whop session to get user ID
    const whopSession = await getWhopSession();
    if (whopSession) {
      // Find user by Whop User ID
      const user = await prisma.user.findUnique({
        where: { whopUserId: whopSession.userId }
      });
      return user?.id || null;
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  // SECURITY: Only allow dev auth if explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_AUTH === 'true') {
    return await getDevUser();
  }
  
  // PRODUCTION: Use Whop session OR Whop Experience headers
  const whopSession = await getWhopSession();
  if (whopSession) {
    // Find user by Whop User ID
    const user = await prisma.user.findUnique({
      where: { whopUserId: whopSession.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        whopCompanyId: true,
        whopUserId: true
      }
    });
    return user;
  }
  
  // FALLBACK: Try Experience Headers directly  
  const { getWhopUserFromHeaders } = await import('./whop-auth');
  const whopUser = await getWhopUserFromHeaders();
  
  if (whopUser) {
    // For Experience apps, auto-create user if needed
    const user = await prisma.user.findUnique({
      where: { whopUserId: whopUser.userId }
    });
    
    if (!user) {
      // Auto-create user from Experience headers
      const isOwner = whopUser.companyId === process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
      
      const tenant = await prisma.tenant.findFirst() || await prisma.tenant.create({
        data: { name: 'Default Organization' }
      });
      
      const newUser = await prisma.user.create({
        data: {
          email: whopUser.user?.email || `${whopUser.userId}@whop.com`,
          name: whopUser.user?.username || `User ${whopUser.userId.slice(-6)}`,
          role: isOwner ? 'ADMIN' : 'USER',
          tenantId: tenant.id,
          whopUserId: whopUser.userId,
          whopCompanyId: whopUser.companyId || process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
          isFreeTier: !isOwner,
          subscriptionStatus: 'active',
          tier: isOwner ? 'enterprise' : 'basic'
        }
      });
      
      console.log(`🆕 Auto-created user: ${newUser.email} (${newUser.role})`);
      return newUser;
    }
    
    return user;
  }
  
  return null;
}
