/**
 * 🔍 ANALYZE REAL WHOP DATA
 * 
 * Verwendet die echten Whop Credentials um verfügbare Felder zu analysieren
 */

async function analyzeRealWhopData() {
  console.log('🔍 Analyzing REAL Whop data...\n');

  // Echte Whop Credentials
  const WHOP_API_KEY = 'xGCaKZ6n2xk4ZjdhNphMUI6MXMnTQmEKyDN1eCIuIIc';
  const WHOP_APP_ID = 'app_ZYUHlzHinpA5Ce';
  const WHOP_USER_ID = 'user_Z9GOqqGEJWyjG';
  const WHOP_COMPANY_ID = 'biz_YoIIIT73rXwrtK';

  console.log('🔑 Using real credentials:');
  console.log(`   API Key: ${WHOP_API_KEY.substring(0, 10)}...`);
  console.log(`   App ID: ${WHOP_APP_ID}`);
  console.log(`   User ID: ${WHOP_USER_ID}`);
  console.log(`   Company ID: ${WHOP_COMPANY_ID}`);

  // Test API Endpunkte mit echten Daten
  const testEndpoints = [
    {
      name: 'Me Endpoint',
      url: 'https://api.whop.com/v5/me',
    },
    {
      name: 'User Companies',
      url: `https://api.whop.com/v5/users/${WHOP_USER_ID}/companies`,
    },
    {
      name: 'Specific Company Details',
      url: `https://api.whop.com/v5/companies/${WHOP_COMPANY_ID}`,
    },
    {
      name: 'Company Products',
      url: `https://api.whop.com/v5/companies/${WHOP_COMPANY_ID}/products`,
    }
  ];

  for (const endpoint of testEndpoints) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📡 Testing: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Authorization': `Bearer ${WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log('📋 Full Response:', JSON.stringify(data, null, 2));
        
        // Spezielle Analyse für Company-Daten
        if (endpoint.name.includes('Companies') || endpoint.name.includes('Company')) {
          console.log('\n🎯 COMPANY DATA ANALYSIS:');
          
          const companies = data.data ? data.data : [data];
          companies.forEach((company, index) => {
            if (company && typeof company === 'object') {
              console.log(`\n${index + 1}. COMPANY FIELDS:`);
              console.log('📊 Available Fields:', Object.keys(company));
              
              // URL-relevante Felder analysieren
              console.log('\n🔗 URL-RELEVANT FIELDS:');
              console.log(`   ✅ ID: ${company.id || 'NOT AVAILABLE'}`);
              console.log(`   ✅ Name: ${company.name || 'NOT AVAILABLE'}`);
              console.log(`   ${company.handle ? '✅' : '❌'} Handle: ${company.handle || 'NOT AVAILABLE'}`);
              console.log(`   ${company.username ? '✅' : '❌'} Username: ${company.username || 'NOT AVAILABLE'}`);
              console.log(`   ${company.slug ? '✅' : '❌'} Slug: ${company.slug || 'NOT AVAILABLE'}`);
              console.log(`   ${company.vanity_url ? '✅' : '❌'} Vanity URL: ${company.vanity_url || 'NOT AVAILABLE'}`);
              console.log(`   ${company.url ? '✅' : '❌'} URL: ${company.url || 'NOT AVAILABLE'}`);
              
              // Generiere optimierte URL basierend auf verfügbaren Daten
              console.log('\n🚀 URL OPTIMIZATION ANALYSIS:');
              if (company.handle) {
                console.log(`   🎯 OPTIMAL URL: https://whop.com/${company.handle}/`);
              } else if (company.username) {
                console.log(`   🎯 FALLBACK URL: https://whop.com/${company.username}/`);
              } else if (company.slug) {
                console.log(`   🎯 SLUG URL: https://whop.com/${company.slug}/`);
              } else {
                console.log(`   ⚠️ COMPANY ID URL: https://whop.com/company${company.id}/`);
              }
            }
          });
        }
        
      } else {
        console.log('❌ FAILED');
        const errorText = await response.text();
        console.log('Error Response:', errorText);
      }
    } catch (error) {
      console.log('❌ Request Failed:', error.message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎯 SUMMARY: Real Whop API Analysis Complete!');
}

analyzeRealWhopData();