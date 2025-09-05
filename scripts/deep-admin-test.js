// scripts/deep-admin-test.js
// Tiefes Testing aller Admin-Funktionen

const http = require('http');

async function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'dev-admin=true', // Dev admin session
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testAdminEndpoint(name, path, method = 'GET', body = null) {
  try {
    console.log(`\n🔐 Testing Admin: ${name}...`);
    console.log(`   ${method} ${path}`);
    
    const result = await makeRequest(path, method, body);
    
    if (result.statusCode >= 200 && result.statusCode < 300) {
      console.log(`   ✅ SUCCESS (${result.statusCode})`);
      if (result.data && typeof result.data === 'object') {
        if (Array.isArray(result.data)) {
          console.log(`   📊 Response: Array with ${result.data.length} items`);
        } else {
          console.log(`   📊 Response: Object with keys: ${Object.keys(result.data).join(', ')}`);
        }
      }
      return { success: true, ...result };
    } else {
      console.log(`   ❌ FAILED (${result.statusCode})`);
      console.log(`   Error: ${JSON.stringify(result.data)}`);
      return { success: false, ...result };
    }
  } catch (error) {
    console.log(`   💥 ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function deepAdminTests() {
  console.log('🛡️ DEEP ADMIN FUNCTIONALITY TESTING');
  console.log('====================================\n');
  
  // Test Dev Admin Login
  console.log('🔓 DEV ADMIN LOGIN TEST');
  const loginResult = await testAdminEndpoint('Dev Admin Login', '/api/auth/dev-admin', 'POST');
  
  if (!loginResult.success) {
    console.log('❌ Cannot proceed without admin access!');
    return;
  }
  
  // Test Admin API Endpoints
  console.log('\n📊 ADMIN API ENDPOINTS');
  await testAdminEndpoint('Admin Check', '/api/auth/check-admin');
  await testAdminEndpoint('Whop Products', '/api/admin/whop-products');
  await testAdminEndpoint('Revenue Settings', '/api/admin/whop/revenue-settings');
  await testAdminEndpoint('Admin Products', '/api/admin/products');
  
  // Test Challenge Management
  console.log('\n🎯 CHALLENGE MANAGEMENT');
  
  // Get challenge ID from database
  const challengeId = 'cmf5qt2w10001t3l0c01wbguq'; // From our test challenge
  
  await testAdminEndpoint('Challenge Analytics', `/api/admin/analytics/${challengeId}`);
  await testAdminEndpoint('Marketing Insights', `/api/admin/marketing-insights/${challengeId}`);
  await testAdminEndpoint('Participant Segments', `/api/admin/segments/${challengeId}`);
  await testAdminEndpoint('Product Opportunities', `/api/admin/product-opportunities/${challengeId}`);
  
  // Test Whop Integration
  console.log('\n🏪 WHOP INTEGRATION TESTS');
  
  await testAdminEndpoint('Create Whop Product', '/api/admin/whop/create-product', 'POST', {
    name: 'Deep Test Product',
    description: 'Product created during deep testing',
    price: 97,
    productType: 'course'
  });
  
  await testAdminEndpoint('Update Revenue Settings', '/api/admin/whop/revenue-settings', 'POST', {
    revenueShare: 10,
    tier: 'premium'
  });
  
  // Test Challenge Offers
  console.log('\n💰 MONETIZATION TESTS');
  
  await testAdminEndpoint('Challenge Offers', '/api/admin/challenge-offers');
  await testAdminEndpoint('Create Challenge Offer', '/api/admin/challenge-offers', 'POST', {
    challengeId: challengeId,
    whopProductId: 'test-product-id',
    offerType: 'completion',
    discountPercentage: 25,
    originalPrice: 97,
    discountedPrice: 72.75,
    timeLimit: 48,
    customMessage: 'Deep test offer!'
  });
  
  console.log('\n🎯 DEEP ADMIN TESTING COMPLETE!');
}

deepAdminTests().catch(console.error);
