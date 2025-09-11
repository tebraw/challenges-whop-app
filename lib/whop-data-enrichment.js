/**
 * 🔍 WHOP DATA ENRICHMENT (JavaScript Version)
 * 
 * Holt automatisch echte Community-Daten aus der Whop API
 * und enriched Tenants mit Handle und Product ID
 */

/**
 * Holt echte Company-Daten aus der Whop API
 */
async function fetchWhopCompanyData(companyId) {
  try {
    console.log(`🔍 Fetching Whop company data for: ${companyId}`);
    
    // Whop API call to get company details
    const response = await fetch(`https://api.whop.com/api/v3/companies/${companyId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`⚠️ Whop API error ${response.status} for company ${companyId}`);
      return null;
    }

    const companyData = await response.json();
    console.log(`✅ Got company data:`, {
      id: companyData.id,
      name: companyData.name,
      handle: companyData.handle
    });

    // Get products for this company to find default product ID
    const productsResponse = await fetch(`https://api.whop.com/api/v3/companies/${companyId}/products`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let defaultProductId;
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      // Take first active product as default
      const activeProduct = productsData.data?.find((p) => p.visibility === 'visible');
      defaultProductId = activeProduct?.id;
      console.log(`✅ Found default product: ${defaultProductId}`);
    }

    return {
      id: companyData.id,
      name: companyData.name,
      handle: companyData.handle,
      defaultProductId
    };

  } catch (error) {
    console.error(`❌ Error fetching Whop company data for ${companyId}:`, error);
    return null;
  }
}

/**
 * Enriched einen Tenant mit echten Whop-Daten
 */
async function enrichTenantWithWhopData(tenantId, companyId) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    console.log(`🔄 Enriching tenant ${tenantId} with Whop data...`);

    const whopData = await fetchWhopCompanyData(companyId);
    if (!whopData) {
      console.log(`⚠️ Could not fetch Whop data for company ${companyId}`);
      return null;
    }

    // Update tenant with real Whop data
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: whopData.name || `Company ${companyId}`,
        whopHandle: whopData.handle,
        whopProductId: whopData.defaultProductId
      }
    });

    console.log(`✅ Tenant enriched with Whop data:`, {
      name: updatedTenant.name,
      handle: updatedTenant.whopHandle,
      productId: updatedTenant.whopProductId
    });

    await prisma.$disconnect();
    return updatedTenant;

  } catch (error) {
    console.error(`❌ Error enriching tenant:`, error);
    await prisma.$disconnect();
    return null;
  }
}

/**
 * Inferiert Handle aus Community-Namen wenn Whop API Handle fehlt
 */
function inferHandleFromName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .slice(0, 20); // Keep reasonable length
}

module.exports = {
  fetchWhopCompanyData,
  enrichTenantWithWhopData,
  inferHandleFromName
};