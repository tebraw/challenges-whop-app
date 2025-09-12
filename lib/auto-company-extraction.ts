// FINAL AUTH UPDATE: Auto Company ID Extraction on Every Login
// This replaces ALL fallback logic with automatic extraction

import { prisma } from '@/lib/prisma';

/**
 * Extract real company ID from experience ID - NO FALLBACKS!
 */
function extractCompanyIdFromExperience(experienceId: string): string | null {
  if (!experienceId || !experienceId.startsWith('exp_')) {
    return null;
  }
  const experienceCode = experienceId.replace('exp_', '');
  return `biz_${experienceCode}`;
}

/**
 * Get real company ID - NO FALLBACKS ALLOWED!
 */
function getRealCompanyId(experienceId: string | null, headerCompanyId: string | null): string | null {
  // Company Owner: no experience ID, has company ID from headers
  if (!experienceId && headerCompanyId) {
    return headerCompanyId;
  }
  
  // Experience Member: extract company ID from experience ID
  if (experienceId) {
    return extractCompanyIdFromExperience(experienceId);
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
        whopCompanyId: companyId,
        whopHandle: experienceId ? `exp-${experienceId.replace('exp_', '')}` : `company-${companyId.replace('biz_', '')}`,
        whopProductId: experienceId ? `prod_${experienceId.replace('exp_', '')}` : null
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
  const realCompanyId = getRealCompanyId(experienceId, headerCompanyId);
  
  if (!realCompanyId) {
    console.log("❌ FATAL: Cannot determine real company ID!");
    throw new Error(`🚨 NO FALLBACK COMPANY IDs ALLOWED! Experience: ${experienceId}, Header: ${headerCompanyId}`);
  }
  
  console.log(`✅ Real Company ID determined: ${realCompanyId}`);
  
  // Determine user type and role
  const isCompanyOwner = !experienceId && headerCompanyId;
  const userRole = isCompanyOwner ? 'ADMIN' : 'USER';
  const userType = isCompanyOwner ? 'Company Owner' : 'Experience Member';
  
  console.log(`👤 User Type: ${userType} → Role: ${userRole}`);
  
  // Get or create tenant
  const tenant = await getOrCreateTenant(realCompanyId, experienceId);
  
  // Create or update user
  const user = await prisma.user.upsert({
    where: { whopUserId },
    update: {
      whopCompanyId: realCompanyId,
      role: userRole,
      tenantId: tenant.id,
      experienceId: experienceId || null
    },
    create: {
      email: `user_${whopUserId.slice(-6)}@whop.com`,
      name: `User ${whopUserId.slice(-6)}`,
      role: userRole,
      whopCompanyId: realCompanyId,
      whopUserId: whopUserId,
      tenantId: tenant.id,
      experienceId: experienceId || null
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