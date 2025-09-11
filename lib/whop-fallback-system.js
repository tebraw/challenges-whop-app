/**
 * 🔧 ROBUST WHOP HANDLE SYSTEM
 * 
 * Fallback-System wenn Whop API keine echten Daten liefert
 */

const { PrismaClient } = require('@prisma/client');

/**
 * Erweiterte Handle-Generation mit mehreren Strategien
 */
function generateWhopHandle(company) {
  // Strategie 1: Aus company.name
  if (company.name && company.name !== `Company ${company.id}`) {
    return company.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
  }
  
  // Strategie 2: Aus company.handle (falls verfügbar)
  if (company.handle) {
    return company.handle.toLowerCase();
  }
  
  // Strategie 3: Aus company.username (falls verfügbar)
  if (company.username) {
    return company.username.toLowerCase();
  }
  
  // Strategie 4: Fallback zu company.id
  return `company${company.id.slice(0, 10)}`;
}

/**
 * Versucht Product ID zu ermitteln
 */
function getDefaultProductId(company) {
  // Wenn company bereits Product-Info hat
  if (company.defaultProductId) {
    return company.defaultProductId;
  }
  
  // Wenn company.products verfügbar ist
  if (company.products && company.products.length > 0) {
    return company.products[0].id;
  }
  
  // Fallback: Generiere wahrscheinliche Product ID
  return `prod_${company.id.slice(0, 10)}`;
}

/**
 * Intelligente Tenant-Erstellung mit Fallbacks
 */
async function createTenantWithSmartFallbacks(company) {
  const prisma = new PrismaClient();
  
  try {
    console.log(`🧠 Creating tenant with smart fallbacks for:`, {
      id: company.id,
      name: company.name,
      handle: company.handle
    });

    // Generiere Handle mit Fallback-Strategien
    const whopHandle = generateWhopHandle(company);
    const whopProductId = getDefaultProductId(company);
    
    console.log(`📋 Generated data:`, {
      whopHandle,
      whopProductId
    });

    // Erstelle/Update Tenant
    const tenant = await prisma.tenant.upsert({
      where: { whopCompanyId: company.id },
      update: {
        name: company.name || `Company ${company.id}`,
        whopHandle: whopHandle,
        whopProductId: whopProductId
      },
      create: {
        name: company.name || `Company ${company.id}`,
        whopCompanyId: company.id,
        whopHandle: whopHandle,
        whopProductId: whopProductId
      }
    });

    console.log(`✅ Tenant created/updated with smart fallbacks:`, {
      name: tenant.name,
      whopHandle: tenant.whopHandle,
      whopProductId: tenant.whopProductId
    });

    await prisma.$disconnect();
    return tenant;

  } catch (error) {
    console.error(`❌ Error creating tenant with fallbacks:`, error);
    await prisma.$disconnect();
    return null;
  }
}

module.exports = {
  generateWhopHandle,
  getDefaultProductId,
  createTenantWithSmartFallbacks
};