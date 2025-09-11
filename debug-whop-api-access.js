/**
 * 🔍 DEBUG WHOP API ACCESS
 * 
 * Testet verschiedene Whop API Endpunkte um das Problem zu finden
 */

// Load environment variables manually
const WHOP_API_KEY = 'xGCaKZ6n2xk4ZjdhNphMUI6MXMnTQmEKyDN1eCIuIIc';
const WHOP_COMPANY_ID = 'biz_YoIIIT73rXwrtK';
const WHOP_USER_ID = 'user_Z9GOqqGEJWyjG';

async function debugWhopApi() {
  console.log('🔍 Debugging Whop API access with REAL data...\n');

  console.log('🔑 Using real API Key:', WHOP_API_KEY.substring(0, 10) + '...');
  console.log('🏢 Real Company ID:', WHOP_COMPANY_ID);
  console.log('👤 Real User ID:', WHOP_USER_ID);

  // Test verschiedene Endpunkte mit echten Daten
  const testEndpoints = [
    {
      name: 'Company Details (REAL)',
      url: `https://api.whop.com/v5/companies/${WHOP_COMPANY_ID}`,
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'User Companies (REAL USER)',
      url: `https://api.whop.com/v5/users/${WHOP_USER_ID}/companies`,
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Company Products',
      url: `https://api.whop.com/v5/companies/${WHOP_COMPANY_ID}/products`,
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  ];

  for (const endpoint of testEndpoints) {
    console.log(`\n📡 Testing: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, {
        headers: endpoint.headers
      });

      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success!');
        
        if (endpoint.name.includes('Company Details')) {
          console.log('\n🎯 REAL COMPANY DATA ANALYSIS:');
          console.log('🔍 FULL COMPANY DATA:', JSON.stringify(data, null, 2));
          console.log('\n📊 FIELD ANALYSIS:');
          console.log(`   ✅ ID: ${data.id}`);
          console.log(`   ✅ Name: ${data.name}`);
          console.log(`   ${data.handle ? '✅' : '❌'} Handle: ${data.handle || 'NOT AVAILABLE'}`);
          console.log(`   ${data.username ? '✅' : '❌'} Username: ${data.username || 'NOT AVAILABLE'}`);
          console.log(`   ${data.slug ? '✅' : '❌'} Slug: ${data.slug || 'NOT AVAILABLE'}`);
          console.log(`   ${data.url ? '✅' : '❌'} URL: ${data.url || 'NOT AVAILABLE'}`);
          console.log(`   ${data.vanity_url ? '✅' : '❌'} Vanity URL: ${data.vanity_url || 'NOT AVAILABLE'}`);
          console.log('📋 Available Fields:', Object.keys(data));
        } else {
          console.log('Response:', JSON.stringify(data, null, 2));
        }
      } else {
        console.log('❌ Failed');
        const errorText = await response.text();
        console.log('Error:', errorText);
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
  }
}
  
  if (!WHOP_API_KEY) {
    console.log('❌ WHOP_API_KEY not found in environment');
    return;
  }

  console.log('🔑 API Key found:', WHOP_API_KEY.substring(0, 10) + '...');

  // Test verschiedene Endpunkte
  const testEndpoints = [
    {
      name: 'API Health Check',
      url: 'https://api.whop.com/v5/me',
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Companies List',
      url: 'https://api.whop.com/v5/companies',
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'User Companies (Real User)',
      url: 'https://api.whop.com/v5/users/user_eGf5vVjIuGLSy/companies',
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  ];

  for (const endpoint of testEndpoints) {
    console.log(`\n📡 Testing: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, {
        headers: endpoint.headers
      });

      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ Failed');
        const errorText = await response.text();
        console.log('Error:', errorText);
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
  }

  // Test ob das eine Development vs Production API Key Sache ist
  console.log('\n🔍 API Key Analysis:');
  console.log('Key starts with:', WHOP_API_KEY.substring(0, 5));
  console.log('Key length:', WHOP_API_KEY.length);
  
  if (WHOP_API_KEY.startsWith('whop_test_')) {
    console.log('🧪 This appears to be a TEST API key');
  } else if (WHOP_API_KEY.startsWith('whop_live_')) {
    console.log('🚀 This appears to be a LIVE API key');
  } else {
    console.log('🤔 Unknown API key format');
  }
}

debugWhopApi();