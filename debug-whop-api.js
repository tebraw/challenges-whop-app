/**
 * 🔍 DEBUG WHOP API RESPONSE
 * 
 * Analysiert was die Whop API wirklich zurückgibt
 */

const { PrismaClient } = require('@prisma/client');

async function debugWhopApiResponse() {
  console.log('🔍 Debugging Whop API response...\n');

  // Simuliere was die auth.ts macht
  try {
    const WHOP_API_KEY = process.env.WHOP_API_KEY;
    const userId = 'user_test'; // Dummy user ID

    if (!WHOP_API_KEY) {
      console.log('❌ WHOP_API_KEY not found in environment');
      return;
    }

    // 1. Test User Companies Endpoint
    console.log('📡 Testing User Companies endpoint...');
    const userCompaniesResponse = await fetch(`https://api.whop.com/api/v3/users/${userId}/companies`, {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`
      }
    });

    console.log('Status:', userCompaniesResponse.status);
    if (userCompaniesResponse.ok) {
      const companiesData = await userCompaniesResponse.json();
      console.log('📋 User companies response:', JSON.stringify(companiesData, null, 2));
    } else {
      console.log('⚠️ User companies request failed');
    }

    // 2. Test Company Details Endpoint (if we have a company ID)
    const testCompanyId = '9nmw5yleoqldrxf7n48c'; // From our test data
    
    console.log('\n📡 Testing Company Details endpoint...');
    const companyResponse = await fetch(`https://api.whop.com/api/v3/companies/${testCompanyId}`, {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`
      }
    });

    console.log('Status:', companyResponse.status);
    if (companyResponse.ok) {
      const companyData = await companyResponse.json();
      console.log('📋 Company details response:', JSON.stringify(companyData, null, 2));
    } else {
      console.log('⚠️ Company details request failed');
    }

    // 3. Test Products Endpoint
    console.log('\n📡 Testing Products endpoint...');
    const productsResponse = await fetch(`https://api.whop.com/api/v3/companies/${testCompanyId}/products`, {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`
      }
    });

    console.log('Status:', productsResponse.status);
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log('📋 Products response:', JSON.stringify(productsData, null, 2));
    } else {
      console.log('⚠️ Products request failed');
    }

  } catch (error) {
    console.error('❌ Error debugging Whop API:', error);
  }
}

debugWhopApiResponse();