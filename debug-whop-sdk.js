// Test script to check if the issue is Whop SDK token verification failure
const https = require('https');

async function testWhopSDKEndpoint() {
  console.log('🔍 Testing Whop SDK verification...');
  
  const testData = JSON.stringify({
    headers: {
      'x-whop-user-token': 'dummy_token_test',
      'x-whop-experience-id': 'exp_test123',
      'x-whop-company-id': 'biz_test123',
      'x-whop-user-id': 'user_test123'
    }
  });
  
  const options = {
    hostname: 'challenges-whop-app-sqmr.vercel.app',
    port: 443,
    path: '/api/debug/whop-headers',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData),
      'X-Whop-User-Token': 'dummy_token_test',
      'X-Whop-Experience-Id': 'exp_test123',
      'X-Whop-Company-Id': 'biz_test123',
      'X-Whop-User-Id': 'user_test123'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('📊 Debug Response:');
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
        
        if (res.statusCode === 200) {
          try {
            const debugData = JSON.parse(data);
            console.log('✅ Whop context detected:', debugData);
          } catch (error) {
            console.log('❌ Invalid JSON response');
          }
        } else {
          console.log('❌ Debug endpoint failed');
        }
        
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request Error:', error.message);
      reject(error);
    });
    
    req.write(testData);
    req.end();
  });
}

async function checkApiEndpoints() {
  console.log('🔍 Testing critical API endpoints...\n');
  
  const endpoints = [
    '/api/health',
    '/api/debug/whop-headers',
    '/api/challenges'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint}...`);
    
    try {
      const result = await new Promise((resolve, reject) => {
        const req = https.get(`https://challenges-whop-app-sqmr.vercel.app${endpoint}`, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      console.log(`  ✅ ${endpoint}: ${result.status}`);
      
    } catch (error) {
      console.log(`  ❌ ${endpoint}: ${error.message}`);
    }
  }
}

async function runDiagnosis() {
  console.log('🚀 Running Whop SDK Diagnosis...\n');
  
  await checkApiEndpoints();
  console.log('\n' + '='.repeat(50));
  await testWhopSDKEndpoint();
  
  console.log('\n🎯 POTENTIAL SOLUTIONS:');
  console.log('1. Remove automatic redirects in main page for Whop iframes');
  console.log('2. Add better error handling for Whop SDK failures');
  console.log('3. Show content directly instead of redirecting');
  console.log('4. Add iframe detection to prevent redirects');
}

runDiagnosis().catch(console.error);