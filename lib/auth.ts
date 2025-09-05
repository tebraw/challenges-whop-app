// lib/auth.ts - Admin Security Helper
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { isDevAdmin, getDevUser } from './devAuth';

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
    
    // PRODUCTION: Only use Whop session tokens
    const sessionToken = cookieStore.get('whop_session')?.value;
    if (!sessionToken) return null;
    
    // TODO: Verify session with Whop API and get user ID
    // This must be implemented for production security
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
  
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      whopCompanyId: true
    }
  });
}
