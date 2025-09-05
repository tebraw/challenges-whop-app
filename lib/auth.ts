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
        whopUserId: true,
        tenantId: true
      }
    });
    return user;
  }
  
  // FALLBACK: Try Experience Headers directly  
  const { getWhopUserFromHeaders } = await import('./whop-auth');
  const whopUser = await getWhopUserFromHeaders();
  
  if (whopUser) {
    // For Experience apps, auto-create user if needed
    let user = await prisma.user.findUnique({
      where: { whopUserId: whopUser.userId },
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
    
    if (!user) {
      // MULTI-TENANT: Determine user's company and role
      const userCompanyId = whopUser.companyId;
      
      // Get or create tenant for this company
      let tenant = await prisma.tenant.findFirst({
        where: { name: `Company ${userCompanyId?.slice(-6) || 'Unknown'}` }
      });
      
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: `Company ${userCompanyId?.slice(-6) || 'Unknown'}`
          }
        });
        console.log(`🆕 Created tenant for company: ${userCompanyId}`);
      }
      
      // Check if user owns this company (admin) or is a member (user)
      const isOwner = await isUserCompanyOwner(whopUser.userId, userCompanyId);
      
      user = await prisma.user.create({
        data: {
          email: whopUser.user?.email || `${whopUser.userId}@whop.com`,
          name: whopUser.user?.username || `User ${whopUser.userId.slice(-6)}`,
          role: isOwner ? 'ADMIN' : 'USER',
          tenantId: tenant.id,
          whopUserId: whopUser.userId
        },
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
      
      if (user) {
        console.log(`🆕 Auto-created user: ${user.email} (${user.role}) for company ${userCompanyId}`);
      }
    }
    
    return user;
  }
  
  return null;
}

// Helper function to check if user owns a company
async function isUserCompanyOwner(userId: string, companyId: string | null | undefined): Promise<boolean> {
  if (!companyId) return false;
  
  try {
    const userCompaniesResponse = await fetch(`https://api.whop.com/v5/users/${userId}/companies`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (userCompaniesResponse.ok) {
      const userCompanies = await userCompaniesResponse.json();
      return userCompanies.data?.some((company: any) => company.id === companyId) || false;
    }
  } catch (error) {
    console.error('Error checking company ownership:', error);
  }
  
  return false;
}
