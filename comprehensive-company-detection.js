// comprehensive-company-detection.js
// Try EVERY possible way to get real company data

const apiKey = 'ZuEYgRPbg-AiKVSuSZihLqPk08wOaI-xBIuGNTuAZNU';
const companyId = 'biz_YoIIIT73rXwrtK';

async function comprehensiveCompanyDetection() {
  console.log('🔍 COMPREHENSIVE COMPANY DETECTION');
  console.log('='.repeat(60));
  console.log(`🔑 API Key: ${apiKey.substring(0, 20)}...`);
  console.log(`🏢 Known Company ID: ${companyId}`);
  console.log('');

  // Strategy 1: Try different v2 endpoints
  const v2Endpoints = [
    'https://api.whop.com/v2/me',
    'https://api.whop.com/v2/companies',
    `https://api.whop.com/v2/companies/${companyId}`,
    `https://api.whop.com/v2/companies/${companyId}/members`,
    `https://api.whop.com/v2/companies/${companyId}/products`,
    'https://api.whop.com/v2/memberships',
    'https://api.whop.com/v2/users',
    'https://api.whop.com/v2/products',
    'https://api.whop.com/v2/plans',
    'https://api.whop.com/v2/licenses'
  ];

  console.log('🧪 STRATEGY 1: Test all v2 endpoints');
  console.log('='.repeat(40));

  const workingEndpoints = [];

  for (const url of v2Endpoints) {
    const endpoint = url.split('/').pop();
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`${endpoint.padEnd(20)} → ${response.status}`);

      if (response.ok) {
        workingEndpoints.push({ name: endpoint, url, data: await response.json() });
      }
    } catch (error) {
      console.log(`${endpoint.padEnd(20)} → ERROR: ${error.message}`);
    }
  }

  console.log('');
  console.log('🎯 WORKING ENDPOINTS:');
  console.log('='.repeat(40));

  for (const endpoint of workingEndpoints) {
    console.log(`✅ ${endpoint.name}: ${endpoint.url}`);
    
    // Analyze data for company info
    const data = endpoint.data;
    
    if (data.data && Array.isArray(data.data)) {
      console.log(`   📊 Found ${data.data.length} items`);
      
      if (data.data.length > 0) {
        const sample = data.data[0];
        const keys = Object.keys(sample);
        
        // Look for company-related fields
        const companyFields = keys.filter(k => 
          k.includes('company') || k.includes('business') || k.includes('owner')
        );
        
        const userFields = keys.filter(k => 
          k.includes('user') || k.includes('email') || k.includes('member')
        );

        if (companyFields.length > 0) {
          console.log(`   🏢 Company fields: ${companyFields.join(', ')}`);
          companyFields.forEach(field => {
            const value = sample[field];
            if (value) console.log(`      ${field}: ${value}`);
          });
        }

        if (userFields.length > 0) {
          console.log(`   👤 User fields: ${userFields.join(', ')}`);
          userFields.forEach(field => {
            const value = sample[field];
            if (value && typeof value === 'object') {
              console.log(`      ${field}: ${JSON.stringify(value)}`);
            } else if (value) {
              console.log(`      ${field}: ${value}`);
            }
          });
        }
      }
    } else if (typeof data === 'object') {
      const keys = Object.keys(data);
      console.log(`   📋 Object keys: ${keys.join(', ')}`);
      
      // Look for company info at root level
      if (data.company || data.companies || data.business) {
        console.log('   🎯 FOUND COMPANY DATA AT ROOT!');
        console.log(`   Company: ${JSON.stringify(data.company || data.companies || data.business)}`);
      }
    }
    
    console.log('');
  }

  // Strategy 2: Try with different auth headers
  console.log('🧪 STRATEGY 2: Try different authentication methods');
  console.log('='.repeat(40));

  const authMethods = [
    { name: 'Bearer', header: `Bearer ${apiKey}` },
    { name: 'Token', header: `Token ${apiKey}` },
    { name: 'API-Key', header: apiKey }
  ];

  for (const auth of authMethods) {
    console.log(`Testing with ${auth.name} auth:`);
    
    try {
      const headers = auth.name === 'API-Key' 
        ? { 'X-API-Key': auth.header, 'Content-Type': 'application/json' }
        : { 'Authorization': auth.header, 'Content-Type': 'application/json' };

      const response = await fetch('https://api.whop.com/v2/memberships', { headers });
      console.log(`   Status: ${response.status}`);
      
      if (response.ok && response.status === 200) {
        const data = await response.json();
        console.log('   ✅ SUCCESS with different auth!');
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }

  // Strategy 3: Check for user-specific endpoints with known user IDs
  console.log('');
  console.log('🧪 STRATEGY 3: Test with known user IDs');
  console.log('='.repeat(40));

  const knownUserIds = [
    'user_eGf5vVjIuGLSy',
    'user_w3lVukX5x9ayO',
    'user_4CUq7XKZv98Zy',
    'user_HMQlzoJ8oUhV8'
  ];

  for (const userId of knownUserIds) {
    console.log(`Testing user: ${userId}`);
    
    const userEndpoints = [
      `https://api.whop.com/v2/users/${userId}`,
      `https://api.whop.com/v2/users/${userId}/memberships`,
      `https://api.whop.com/v2/memberships?user_id=${userId}`,
      `https://api.whop.com/v2/memberships?user=${userId}`
    ];

    for (const url of userEndpoints) {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        const endpoint = url.split('/').pop();
        console.log(`   ${endpoint.padEnd(15)} → ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log('   ✅ SUCCESS! Found user data');
          
          if (data.company_id || data.companies) {
            console.log(`   🎯 COMPANY FOUND: ${data.company_id || JSON.stringify(data.companies)}`);
          }
        }
      } catch (error) {
        console.log(`   ${url.split('/').pop().padEnd(15)} → ERROR`);
      }
    }
    console.log('');
  }

  // Strategy 4: Check session-based approach (how our app currently works)
  console.log('🧪 STRATEGY 4: Session-based detection (current method)');
  console.log('='.repeat(40));
  console.log('Current method gets user data from Whop session tokens:');
  console.log('✅ User ID from session.userId');
  console.log('✅ Email from session.email'); 
  console.log('✅ Username from session.username');
  console.log('✅ Company ID could be in session.companyId (if available)');
  console.log('');
  console.log('💡 RECOMMENDATION: Check if Whop session contains company_id field');

  console.log('');
  console.log('🎯 FINAL ANALYSIS:');
  console.log('='.repeat(60));
  console.log(`Working endpoints found: ${workingEndpoints.length}`);
  
  if (workingEndpoints.length > 0) {
    console.log('✅ Some API access is working');
    console.log('💡 Focus on extracting company data from working endpoints');
  } else {
    console.log('❌ No API endpoints provide company data');
    console.log('💡 Current unique-company-per-user solution is best');
  }
}

comprehensiveCompanyDetection().catch(console.error);