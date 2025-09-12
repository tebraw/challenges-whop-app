// extract-user-company-mappings.js
// Extract real user-company mappings from v2 API

const apiKey = 'ZuEYgRPbg-AiKVSuSZihLqPk08wOaI-xBIuGNTuAZNU';

async function extractUserCompanyMappings() {
  console.log('🎯 EXTRACTING REAL USER-COMPANY MAPPINGS');
  console.log('='.repeat(60));

  const knownUserIds = [
    'user_eGf5vVjIuGLSy',
    'user_w3lVukX5x9ayO', 
    'user_4CUq7XKZv98Zy',
    'user_HMQlzoJ8oUhV8'
  ];

  const userCompanyMap = new Map();

  for (const userId of knownUserIds) {
    console.log(`🔍 Checking user: ${userId}`);
    
    try {
      // Get user-specific memberships
      const response = await fetch(`https://api.whop.com/v2/memberships?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   📊 Found ${data.data?.length || 0} memberships`);

        if (data.data && data.data.length > 0) {
          // Extract user and company information
          data.data.forEach(membership => {
            const companyId = membership.company_id;
            const userInfo = membership.user;
            const email = membership.email || userInfo?.email;
            const status = membership.status;
            const valid = membership.valid;

            if (companyId) {
              if (!userCompanyMap.has(userId)) {
                userCompanyMap.set(userId, {
                  email: email,
                  companies: new Set(),
                  memberships: []
                });
              }

              const userData = userCompanyMap.get(userId);
              userData.companies.add(companyId);
              userData.memberships.push({
                company_id: companyId,
                status: status,
                valid: valid,
                product: membership.product,
                plan: membership.plan
              });
            }
          });

          console.log(`   ✅ Processed ${data.data.length} memberships`);
        } else {
          console.log('   📭 No memberships found for this user');
        }
      } else {
        console.log(`   ❌ API failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎯 FINAL USER-COMPANY MAPPINGS:');
  console.log('='.repeat(60));

  if (userCompanyMap.size === 0) {
    console.log('❌ No user-company mappings found');
    return;
  }

  for (const [userId, userData] of userCompanyMap) {
    console.log(`👤 User: ${userId}`);
    console.log(`   📧 Email: ${userData.email || 'N/A'}`);
    console.log(`   🏢 Companies: ${Array.from(userData.companies).join(', ')}`);
    console.log(`   📊 Active Memberships: ${userData.memberships.filter(m => m.valid).length}`);
    
    // Show membership details
    userData.memberships.forEach((membership, i) => {
      console.log(`     ${i+1}. Company: ${membership.company_id}`);
      console.log(`        Status: ${membership.status} | Valid: ${membership.valid}`);
      console.log(`        Product: ${membership.product}`);
    });
    
    console.log('');
  }

  // Get company details
  console.log('🏢 COMPANY INFORMATION:');
  console.log('='.repeat(60));

  const allCompanies = new Set();
  for (const [_, userData] of userCompanyMap) {
    userData.companies.forEach(companyId => allCompanies.add(companyId));
  }

  console.log(`Found companies: ${Array.from(allCompanies).join(', ')}`);

  // Try to get company names from products API
  try {
    const productsResponse = await fetch('https://api.whop.com/v2/products', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      
      if (productsData.data && productsData.data.length > 0) {
        const sample = productsData.data[0];
        console.log('📋 Sample product data:');
        console.log(JSON.stringify(sample, null, 2));
      }
    }
  } catch (error) {
    console.log('❌ Could not fetch company details');
  }

  console.log('');
  console.log('💡 IMPLEMENTATION STRATEGY:');
  console.log('='.repeat(60));
  
  if (userCompanyMap.size > 0) {
    console.log('✅ SUCCESS! We can implement real company detection:');
    console.log('');
    console.log('1️⃣ Modify auth.ts to use v2 API:');
    console.log('   - Call /v2/memberships?user_id={userId}');
    console.log('   - Extract company_id from memberships');
    console.log('   - Use real company ID for tenant creation');
    console.log('');
    console.log('2️⃣ Fallback strategy:');
    console.log('   - If API fails → Use current unique-company method');
    console.log('   - Best of both worlds!');
    console.log('');
    console.log('3️⃣ Benefits:');
    console.log('   - Real company names and IDs');
    console.log('   - Proper multi-tenant structure');
    console.log('   - Still secure isolation');
  } else {
    console.log('❌ No usable company data found');
    console.log('💡 Keep current unique-company-per-user solution');
  }
}

extractUserCompanyMappings().catch(console.error);