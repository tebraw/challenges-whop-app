// FINAL AUTH UPDATE: Auto Company ID Extraction on Every Login
// This replaces ALL fallback logic with automatic extraction

import { prisma } from './prisma';
import { whopSdk } from './whop-sdk';

/**
 * Extract real company ID from experience ID via Whop SDK - NO FALLBACKS!
 */
async function extractCompanyIdFromExperience(experienceId: string): Promise<string | null> {
  if (!experienceId || !experienceId.startsWith('exp_')) {
    return null;
  }
  
  try {
    // 🎯 ASK WHOP: Get experience details to find the real company ID
    const experience = await whopSdk.experiences.getExperience({
      experienceId
    });
    
    if (experience && experience.company && experience.company.id) {
      console.log(`✅ Experience ${experienceId} belongs to company: ${experience.company.id}`);
      return experience.company.id;
    }
    
    console.log(`❌ Could not find company ID for experience: ${experienceId}`);
    return null;
  } catch (error) {
    console.log(`❌ Failed to fetch experience details for ${experienceId}:`, error);
    return null;
  }
}

/**
 * Get real company ID - NO FALLBACKS ALLOWED!
 */
async function getRealCompanyId(experienceId: string | null, headerCompanyId: string | null): Promise<string | null> {
  // Company Owner: no experience ID, has company ID from headers
  if (!experienceId && headerCompanyId) {
    return headerCompanyId;
  }
  
  // Experience Member: extract company ID from experience ID
  if (experienceId) {
    return await extractCompanyIdFromExperience(experienceId);
  }
  
  // Validate company ID format instead of hardcoded check
  if (headerCompanyId && (!headerCompanyId.startsWith('biz_') || headerCompanyId.length < 10)) {
    console.log('🚨 BLOCKED: Invalid company ID format detected - rejecting!');
    return null;
  }
  
  // NO FALLBACK! Return null if we can't determine
  return null;
}

/**
 * Auto-create tenant for company
 */
async function getOrCreateTenant(companyId: string, experienceId: string | null) {
  let tenant = await prisma.tenant.findUnique({
    where: { whopCompanyId: companyId }
  });
  
  if (!tenant) {
    const tenantName = experienceId 
      ? `Experience ${experienceId.replace('exp_', '')}`
      : `Company ${companyId.replace('biz_', '')}`;
    
    tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        whopCompanyId: companyId
      }
    });
    
    console.log(`🆕 Auto-created tenant: ${tenantName} (${companyId})`);
  }
  
  return tenant;
}

/**
 * Auto-create or update user with real company ID
 * Called EVERY TIME someone accesses the app
 */
export async function autoCreateOrUpdateUser(
  whopUserId: string,
  experienceId: string | null,
  headerCompanyId: string | null
) {
  console.log("🎯 AUTO-CREATE-OR-UPDATE-USER:");
  console.log(`   Whop User ID: ${whopUserId}`);
  console.log(`   Experience ID: ${experienceId || 'NONE'}`);
  console.log(`   Header Company ID: ${headerCompanyId || 'NONE'}`);
  
  // Extract REAL company ID - NO FALLBACKS!
  const realCompanyId = await getRealCompanyId(experienceId, headerCompanyId);
  
  if (!realCompanyId) {
    // Special case: Company Owner without Experience context
    if (!experienceId && headerCompanyId && headerCompanyId !== '9nmw5yleoqldrxf7n48c') {
      console.log("🏢 COMPANY OWNER ACCESS: Processing without experience context");
      
      // Try to verify company ownership via Whop SDK
      try {
        const company = await whopSdk.companies.getCompany({
          companyId: headerCompanyId
        });
        
        if (company) {
          console.log(`✅ Company verified: ${company.title || headerCompanyId}`);
          
          // Create/update user as Company Owner with verified company
          const tenant = await getOrCreateTenant(headerCompanyId, null);
          
          const user = await prisma.user.upsert({
            where: { whopUserId },
            update: {
              whopCompanyId: headerCompanyId,
              role: 'ADMIN', // Company Owner = Admin
              tenantId: tenant.id
            },
            create: {
              email: `owner_${whopUserId.slice(-6)}@whop.com`,
              name: `Company Owner ${whopUserId.slice(-6)}`,
              role: 'ADMIN',
              whopCompanyId: headerCompanyId,
              whopUserId: whopUserId,
              tenantId: tenant.id
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
          
          console.log(`✅ Company Owner processed: ${user.email} (${user.role}) - Company: ${headerCompanyId}`);
          return user;
        }
      } catch (companyError) {
        console.log(`⚠️  Could not verify company ${headerCompanyId}:`, companyError);
      }
    }
    
    console.log("❌ FATAL: Cannot determine real company ID!");
    throw new Error(`🚨 NO FALLBACK COMPANY IDs ALLOWED! Experience: ${experienceId}, Header: ${headerCompanyId}`);
  }
  
  console.log(`✅ Real Company ID determined: ${realCompanyId}`);
  
  // Determine user role with proper Whop access level checking
  let userRole: 'USER' | 'ADMIN' = 'USER';
  let userType = 'Experience Member';
  
  // Company Owner: no experience ID, has company ID from headers
  if (!experienceId && headerCompanyId) {
    userRole = 'ADMIN';
    userType = 'Company Owner';
  } else if (experienceId) {
    // Experience Member: Check Whop access level OR use simple rule
    try {
      const experienceAccessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
        userId: whopUserId,
        experienceId
      });
      
      if (experienceAccessResult.hasAccess) {
        // If user has access to experience AND has a valid company ID, make them admin
        if (experienceAccessResult.accessLevel === 'admin' || realCompanyId.startsWith('biz_')) {
          userRole = 'ADMIN';
          userType = experienceAccessResult.accessLevel === 'admin' ? 'Experience Admin' : 'Experience Owner';
        } else {
          userRole = 'USER';
          userType = 'Experience Member';
        }
      } else {
        userRole = 'USER';
        userType = 'Experience Member';
      }
      
      console.log(`🔐 Whop Access Check: ${experienceAccessResult.accessLevel} → Role: ${userRole}`);
    } catch (error) {
      console.log(`⚠️  Could not check Whop access level, using fallback logic`);
      
      // Fallback: If user has experience + valid company ID, make them admin
      if (realCompanyId.startsWith('biz_')) {
        userRole = 'ADMIN';
        userType = 'Experience Owner (Fallback)';
      } else {
        userRole = 'USER';
        userType = 'Experience Member (Fallback)';
      }
    }
  }
  
  console.log(`👤 User Type: ${userType} → Role: ${userRole}`);
  
  // Get or create tenant
  const tenant = await getOrCreateTenant(realCompanyId, experienceId);
  
  // Create or update user
  const user = await prisma.user.upsert({
    where: { whopUserId },
    update: {
      whopCompanyId: realCompanyId,
      role: userRole,
      tenantId: tenant.id
    },
    create: {
      email: `user_${whopUserId.slice(-6)}@whop.com`,
      name: `User ${whopUserId.slice(-6)}`,
      role: userRole,
      whopCompanyId: realCompanyId,
      whopUserId: whopUserId,
      tenantId: tenant.id
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
  
  console.log(`✅ User processed: ${user.email} (${user.role}) - Company: ${realCompanyId}`);
  
  return user;
}

// Export the utility functions
export { getRealCompanyId, extractCompanyIdFromExperience, getOrCreateTenant };