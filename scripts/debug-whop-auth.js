// scripts/debug-whop-auth.js
// Debug script to test Whop authentication flow

const http = require('http');

async function debugWhopAuth() {
  console.log('🔍 WHOP AUTHENTICATION DEBUG');
  console.log('=============================\n');

  // Check auth status
  console.log('📡 Checking auth status...');
  try {
    const authStatus = await makeRequest('http://localhost:3000/api/auth/whop/status');
    console.log('✅ Auth Status:', {
      configured: authStatus.configured,
      hasClientId: authStatus.hasClientId,
      hasApiKey: authStatus.hasApiKey,
      message: authStatus.message
    });
  } catch (error) {
    console.log('❌ Auth status check failed:', error.message);
    return;
  }

  console.log('\n🔧 Environment Variables Check:');
  console.log('NEXT_PUBLIC_WHOP_COMPANY_ID:', process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'Missing');
  console.log('WHOP_API_KEY:', process.env.WHOP_API_KEY ? 'Set' : 'Missing');
  console.log('WHOP_OAUTH_CLIENT_ID:', process.env.WHOP_OAUTH_CLIENT_ID ? 'Set' : 'Missing');

  console.log('\n🧪 Test Login URLs:');
  console.log('Dev Admin: http://localhost:3000/auth/whop');
  console.log('Whop OAuth: http://localhost:3000/api/auth/whop/login');
  
  console.log('\n💡 For testing:');
  console.log('1. Open http://localhost:3000/auth/whop');
  console.log('2. Try "Dev Admin Login" first');
  console.log('3. Then try "Mit Whop anmelden" if OAuth is configured');
  console.log('4. Check browser console for debug logs');
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'GET', timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
}

debugWhopAuth().catch(console.error);
