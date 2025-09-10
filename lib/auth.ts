// lib/auth.ts - Admin Security Helper  
import { cookies, headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { isDevAdmin, getDevUser } from './devAuth';
import { getWhopSession } from './whop/auth';
import { getExperienceContext } from './whop-experience';

const prisma = new PrismaClient();

export async function isAdmin(): Promise<boolean> {
  try {
    // SECURITY: Disable development mode in production
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_AUTH === 'true') {
      return await isDevAdmin();
    }
    
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;
    
    // PRODUCTION SECURITY: Admin access through:
    // 1. ADMIN role AND valid Whop company ID AND
    // 2. Active subscription for the company
    if (currentUser.role === 'ADMIN' && currentUser.whopCompanyId) {
      // Check if company has active subscription
      const hasActiveSubscription = await checkActiveSubscription(currentUser.whopCompanyId);
      console.log(`🔐 Admin check: User ${currentUser.email}, Active Subscription: ${hasActiveSubscription}`);
      return hasActiveSubscription;
    }
    
    return false;
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

export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  tenantId: string;
  whopUserId: string | null;
  whopCompanyId: string | null;
} | null> {
  // SECURITY: Only allow dev auth if explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_AUTH === 'true') {
    return await getDevUser();
  }
  
  // DEMO AUTH: Check for demo session cookie (fallback for testing)
  try {
    const cookieStore = await cookies();
    const demoUserId = cookieStore.get('demo-user-id')?.value;
    
    if (demoUserId) {
      console.log('🧪 Using demo authentication');
      const demoUser = await prisma.user.findUnique({
        where: { id: demoUserId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          tenantId: true,
          whopCompanyId: true,
          whopUserId: true
        }
      });
      
      if (demoUser) {
        console.log('✅ Demo user found:', demoUser.email);
        return demoUser;
      }
    }
  } catch (error) {
    console.log('No demo session found, continuing with other auth methods...');
  }

  // PRIORITY 1: Whop Experience App Context
  console.log('🎯 Checking Whop Experience context...');
  
  try {
    const experienceContext = await getExperienceContext();
    
    if (experienceContext.userId && experienceContext.isEmbedded) {
      console.log(`🖼️ Experience App detected - User: ${experienceContext.userId}, Company: ${experienceContext.companyId}, Owner: ${experienceContext.isCompanyOwner}`);
      
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { whopUserId: experienceContext.userId },
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
        console.log('✅ Existing Experience user found:', user.email);
        
        // Update user's role based on current Whop access level
        let updatedRole = await getWhopExperienceRole(experienceContext.userId, experienceContext.companyId);
        
        // FALLBACK: If API call fails but context suggests company owner, grant admin
        if (updatedRole === 'USER' && experienceContext.isCompanyOwner) {
          console.log('🚨 FALLBACK: Context suggests company owner, overriding to ADMIN');
          updatedRole = 'ADMIN';
        }
        
        if (user.role !== updatedRole) {
          console.log(`🔄 Updating user role from ${user.role} to ${updatedRole}`);
          user = await prisma.user.update({
            where: { id: user.id },
            data: { role: updatedRole },
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
        }
        
        return user;
      }
      
      // Create new user with proper role based on Whop access level
      let userRole = await getWhopExperienceRole(experienceContext.userId, experienceContext.companyId);
      
      // FALLBACK: If API call fails but context suggests company owner, grant admin
      if (userRole === 'USER' && experienceContext.isCompanyOwner) {
        console.log('🚨 FALLBACK: Context suggests company owner for new user, overriding to ADMIN');
        userRole = 'ADMIN';
      }
      
      // Get or create tenant for this company
      let tenant = await prisma.tenant.findFirst({
        where: { name: `Company ${experienceContext.companyId?.slice(-6) || 'Unknown'}` }
      });
      
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: `Company ${experienceContext.companyId?.slice(-6) || 'Unknown'}`
          }
        });
        console.log(`🆕 Created tenant for Experience company: ${experienceContext.companyId}`);
      }
      
      user = await prisma.user.create({
        data: {
          email: `user_${experienceContext.userId.slice(-6)}@whop.com`,
          name: `User ${experienceContext.userId.slice(-6)}`,
          role: userRole,
          whopCompanyId: experienceContext.companyId,
          tenantId: tenant.id,
          whopUserId: experienceContext.userId
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
      
      console.log(`✅ Created new Experience user: ${user.email} with role: ${user.role}`);
      return user;
    }
  } catch (error) {
    console.log('No Experience context, continuing with legacy auth...');
  }
  
  // LEGACY AUTH: Continue with previous methods...
  // (Rest of the existing auth logic)
  
  return null;
}

/**
 * Get user's role in Whop Experience based on access level
 */
async function getWhopExperienceRole(userId: string, companyId?: string): Promise<'ADMIN' | 'USER'> {
  try {
    console.log(`🔍 Determining role for user ${userId} in company ${companyId}`);
    
    // PRIORITIZE COMPANY OWNERSHIP CHECK
    // If user is a company owner, they get ADMIN access regardless of Experience setup
    if (companyId) {
      console.log('🏢 Checking company ownership first...');
      
      try {
        // Clean and validate user ID format
        const cleanUserId = userId.trim();
        console.log(`🔍 Making API call to check ownership for user: ${cleanUserId}`);
        
        const userCompaniesResponse = await fetch(`https://api.whop.com/v5/users/${cleanUserId}/companies`, {
          headers: {
            'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`📡 Company ownership API response status: ${userCompaniesResponse.status}`);

        if (userCompaniesResponse.ok) {
          const userCompanies = await userCompaniesResponse.json();
          const ownedCompanies = userCompanies.data || [];
          
          console.log('🔍 User owned companies:', ownedCompanies.map((c: any) => ({ id: c.id, name: c.name })));
          console.log(`🎯 Target company ID: ${companyId}`);
          
          // Check if user owns the target company
          const ownsTargetCompany = ownedCompanies.some((company: any) => company.id === companyId);
          
          if (ownsTargetCompany) {
            console.log('👑 USER IS COMPANY OWNER - granting ADMIN access');
            return 'ADMIN';
          } else {
            console.log('👤 User owns other companies but not this one - checking membership...');
          }
        } else {
          const errorText = await userCompaniesResponse.text();
          console.log('❌ Company ownership API error response:', errorText);
        }
      } catch (companyError) {
        console.log('⚠️ Company ownership check failed:', companyError);
      }
    }
    
    // Import Whop SDK dynamically for Experience check (fallback)
    const { whopSdk } = await import('./whop-sdk');
    
    // Try Experience access check
    const experienceId = process.env.WHOP_EXPERIENCE_ID || process.env.NEXT_PUBLIC_WHOP_EXPERIENCE_ID;
    
    if (experienceId) {
      console.log(`🎯 Using Access Pass check for Experience ID: ${experienceId}`);
      
      const accessResult = await whopSdk.access.checkIfUserHasAccessToAccessPass({
        userId: userId,
        accessPassId: experienceId
      });
      
      console.log('🎯 Access Pass Result:', accessResult);
      
      // Official Whop Access Pass access levels:
      // 'admin' = Company Owner/Moderator → ADMIN role
      // 'customer' = Community Member → USER role  
      // 'no_access' = No access → USER role (fallback)
      const role = accessResult.accessLevel === 'admin' ? 'ADMIN' : 'USER';
      console.log(`🎯 Access Pass Level: ${accessResult.accessLevel} → Database Role: ${role}`);
      
      return role;
    }
    
    // Final fallback to company access check
    if (companyId) {
      console.log('⚠️ No Experience ID found, falling back to company access check');
      
      const companyAccessResult = await whopSdk.access.checkIfUserHasAccessToCompany({
        userId: userId,
        companyId: companyId
      });
      
      console.log('🏢 Company Access Result:', companyAccessResult);
      
      const role = companyAccessResult.accessLevel === 'admin' ? 'ADMIN' : 'USER';
      console.log(`🎯 Company Access Level: ${companyAccessResult.accessLevel} → Database Role: ${role}`);
      
      return role;
    }
    
    console.log('⚠️ No company ID or experience ID available, defaulting to USER');
    return 'USER';
    
  } catch (error) {
    console.log('⚠️ Whop role check failed, falling back to USER role:', error);
    return 'USER';
  }
}

/**
 * Check if company has active subscription for admin access
 */
async function checkActiveSubscription(companyId: string): Promise<boolean> {
  try {
    // Find tenant by company ID
    const tenant = await prisma.tenant.findFirst({
      where: { whopCompanyId: companyId }
    });

    if (!tenant) {
      console.log(`⚠️ No tenant found for company ${companyId}`);
      return false;
    }

    // Check for active subscription
    const activeSubscription = await prisma.whopSubscription.findFirst({
      where: {
        tenantId: tenant.id,
        status: 'active',
        validUntil: {
          gt: new Date() // Must be valid in the future
        }
      }
    });

    if (activeSubscription) {
      console.log(`✅ Active subscription found for tenant ${tenant.id}: ${activeSubscription.whopProductId}`);
      return true;
    } else {
      console.log(`❌ No active subscription found for tenant ${tenant.id}`);
      return false;
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}
