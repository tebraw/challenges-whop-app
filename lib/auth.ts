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
    
    // DEVELOPMENT: Allow ADMIN role users in development mode
    if (process.env.NODE_ENV === 'development') {
      return currentUser.role === 'ADMIN';
    }
    
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
  
  // PRIORITY 1: Dashboard Access (Company Owner accessing app dashboard)
  try {
    const { whopSdk } = await import('./whop-sdk');
    const headersList = await headers();
    
    // Check if this is a Dashboard View access by trying to verify user token
    const whopUserToken = headersList.get('x-whop-user-token') || (await cookies()).get('whop_user_token')?.value;
    
    if (whopUserToken) {
      console.log('🎯 Detected Dashboard View access with user token');
      
      try {
        // Verify the user token and get userId
        const { userId } = await whopSdk.verifyUserToken(headersList);
        
        if (userId) {
          console.log('👤 Dashboard User ID:', userId);
          
          // Extract company ID from app config
          const cookieStore = await cookies();
          const appConfigCookie = cookieStore.get('whop.app-config')?.value;
          let companyId = null;
          
          if (appConfigCookie) {
            try {
              const appConfig = JSON.parse(atob(appConfigCookie.split('.')[1]));
              companyId = appConfig.did;
              console.log('🏢 Dashboard Company ID:', companyId);
            } catch (error) {
              console.log('❌ Failed to parse app config:', error);
            }
          }
          
          if (companyId) {
            // 🎯 OFFICIAL WHOP METHOD: Check company access
            console.log(`🔍 Checking company access for user ${userId} in company ${companyId}...`);
            
            const companyAccessResult = await whopSdk.access.checkIfUserHasAccessToCompany({
              userId,
              companyId
            });
            
            console.log('🏢 Company Access Result:', companyAccessResult);
            
            // Find or create user based on OFFICIAL ACCESS RESULT
            let user = await prisma.user.findUnique({
              where: { whopUserId: userId },
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
            
            // 🎯 OFFICIAL WHOP LOGIC: "admin" access level = Company Owner = ADMIN role
            const correctRole = companyAccessResult.accessLevel === 'admin' ? 'ADMIN' : 'USER';
            
            console.log(`🎯 Company Access Level: ${companyAccessResult.accessLevel} → Database Role: ${correctRole}`);
            
            if (!user) {
              // Get or create tenant for this company
              let tenant = await prisma.tenant.findFirst({
                where: { name: `Company ${companyId?.slice(-6) || 'Unknown'}` }
              });
              
              if (!tenant) {
                tenant = await prisma.tenant.create({
                  data: {
                    name: `Company ${companyId?.slice(-6) || 'Unknown'}`
                  }
                });
                console.log(`🆕 Created tenant for Dashboard company: ${companyId}`);
              }
              
              user = await prisma.user.create({
                data: {
                  email: `user_${userId.slice(-6)}@whop.com`,
                  name: `User ${userId.slice(-6)}`,
                  role: correctRole, // 🎯 Based on official Whop access level
                  whopCompanyId: companyId,
                  tenantId: tenant.id,
                  whopUserId: userId
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
              console.log(`✅ Created new user with role: ${correctRole}`);
            } else {
              // 🎯 CRITICAL: UPDATE EXISTING USER ROLE BASED ON CURRENT ACCESS LEVEL
              if (user.role !== correctRole) {
                console.log(`🔄 Updating user role from ${user.role} to ${correctRole} (Company access level: ${companyAccessResult.accessLevel})`);
                
                user = await prisma.user.update({
                  where: { whopUserId: userId },
                  data: { 
                    role: correctRole,
                    whopCompanyId: companyId // Also update company ID if needed
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
                console.log(`✅ Updated user role to: ${correctRole}`);
              } else {
                console.log(`✅ User already has correct role: ${user.role}`);
              }
            }
            
            console.log('✅ Dashboard Authentication successful:', { 
              userId, 
              role: user.role, 
              companyId,
              whopAccessLevel: companyAccessResult.accessLevel,
              hasAccess: companyAccessResult.hasAccess
            });
            return user;
          }
        }
      } catch (dashboardError) {
        console.log('⚠️ Dashboard authentication failed, trying Experience context:', dashboardError);
      }
    }
  } catch (error) {
    console.log('⚠️ Dashboard context failed, trying Experience context:', error);
  }

  // PRIORITY 2: Experience App Context (Community Members in experiences)
  try {
    const experienceContext = await getExperienceContext();
    if (experienceContext.userId && experienceContext.companyId) {
      console.log('🖼️ Using Experience App context for authentication');
      
      // Find user by Whop User ID
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
      
      if (!user) {
        // Auto-create user for Experience App
        const userCompanyId = experienceContext.companyId;
        
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
          console.log(`🆕 Created tenant for Experience App company: ${userCompanyId}`);
        }
        
        // 🎯 USE WHOP SDK ACCESS LEVEL TO DETERMINE ROLE
        console.log(`🔍 Checking Whop access level for user ${experienceContext.userId} in experience ${experienceContext.experienceId}...`);
        
        try {
          // Import Whop SDK dynamically
          const { whopSdk } = await import('./whop-sdk');
          
          // Check user's access level using official Whop SDK
          const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
            userId: experienceContext.userId,
            experienceId: experienceContext.experienceId || ''
          });
          
          // Official Whop access levels:
          // 'admin' = Company Owner/Moderator → ADMIN role
          // 'customer' = Community Member → USER role  
          // 'no_access' = No access → USER role (fallback)
          const isAdmin = accessResult.accessLevel === 'admin';
          const userRole = isAdmin ? 'ADMIN' : 'USER';
          
          console.log(`� Whop SDK Result - Access Level: ${accessResult.accessLevel} → Role: ${userRole}`);
          
          user = await prisma.user.create({
            data: {
              email: `user_${experienceContext.userId.slice(-6)}@whop.com`,
              name: `User ${experienceContext.userId.slice(-6)}`,
              role: userRole, // 🎯 Based on official Whop access level
              whopCompanyId: userCompanyId,
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
        } catch (sdkError) {
          console.log(`⚠️ Whop SDK failed, falling back to first-user logic:`, sdkError);
          
          // Fallback: First user becomes admin
          const existingAdmin = await prisma.user.findFirst({
            where: {
              whopCompanyId: userCompanyId,
              role: 'ADMIN'
            }
          });
          
          const userRole = existingAdmin ? 'USER' : 'ADMIN';
          console.log(`👤 Fallback - User status: ${existingAdmin ? 'COMMUNITY MEMBER' : 'APP INSTALLER (First User)'} → Role: ${userRole}`);
          
          user = await prisma.user.create({
            data: {
              email: `user_${experienceContext.userId.slice(-6)}@whop.com`,
              name: `User ${experienceContext.userId.slice(-6)}`,
              role: userRole,
              whopCompanyId: userCompanyId,
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
        }
        
        if (user) {
          console.log(`🆕 Auto-created Experience App user: ${user.email} (${user.role}) for company ${userCompanyId}`);
        }
      } else {
        // 🎯 EXISTING USER: Update role based on current Whop access level
        const userCompanyId = experienceContext.companyId;
        
        try {
          // Import Whop SDK dynamically
          const { whopSdk } = await import('./whop-sdk');
          
          // Check current access level using official Whop SDK
          const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
            userId: experienceContext.userId,
            experienceId: experienceContext.experienceId || ''
          });
          
          const isAdmin = accessResult.accessLevel === 'admin';
          const correctRole = isAdmin ? 'ADMIN' : 'USER';
          
          console.log(`🔄 Existing user ${user.email}: Whop Access Level = ${accessResult.accessLevel} → Role should be: ${correctRole}`);
          
          // Update role and company ID if needed
          if (user.role !== correctRole || user.whopCompanyId !== userCompanyId) {
            console.log(`🔄 Updating user ${user.email}: ${user.role} → ${correctRole}, Company: ${user.whopCompanyId} → ${userCompanyId}`);
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                role: correctRole, // 🎯 Update role based on current access level
                whopCompanyId: userCompanyId
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
          }
        } catch (sdkError) {
          console.log(`⚠️ Whop SDK failed for existing user, keeping current role:`, sdkError);
          
          // Fallback: Only update company ID if needed, preserve existing role
          if (user.whopCompanyId !== userCompanyId) {
            console.log(`🔄 Updating company ID for user ${user.email}: ${user.whopCompanyId} → ${userCompanyId}`);
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                whopCompanyId: userCompanyId
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
          }
        }
      }
      
      return user;
    }
  } catch (error) {
    console.log('No valid Experience App context, trying other methods...');
  }
  
  // PRIORITY 2: Whop OAuth session
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
  
  // PRIORITY 3: Legacy Whop headers (fallback)
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
          whopCompanyId: isOwner ? userCompanyId : null, // ✅ SET COMPANY ID FOR OWNERS
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
  if (!companyId) {
    console.log('❌ No company ID provided for ownership check');
    return false;
  }
  
  if (!process.env.WHOP_API_KEY) {
    console.log('❌ No WHOP_API_KEY found in environment');
    return false;
  }
  
  try {
    console.log(`🔍 Checking if user ${userId} owns company ${companyId}...`);
    
    const userCompaniesResponse = await fetch(`https://api.whop.com/v5/users/${userId}/companies`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Whop API response status: ${userCompaniesResponse.status}`);

    if (userCompaniesResponse.ok) {
      const userCompanies = await userCompaniesResponse.json();
      console.log('👥 User companies:', userCompanies.data?.map((c: any) => c.id));
      
      const isOwner = userCompanies.data?.some((company: any) => company.id === companyId) || false;
      console.log(`✅ Ownership result: ${isOwner}`);
      
      return isOwner;
    } else {
      console.log(`❌ Whop API error: ${userCompaniesResponse.status} ${userCompaniesResponse.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error checking company ownership:', error);
  }
  
  return false;
}
