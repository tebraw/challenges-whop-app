#!/usr/bin/env node

/**
 * Whop App Info Checker
 * Tests if your existing WHOP_APP_ID is valid
 */

async function checkWhopApp() {
  console.log('🔍 Checking Whop App Status...\n');
  
  const appId = 'app_ZYUHlzHinpA5Ce';
  const apiKey = 'xGCaKZ6n2xk4ZjdhNphMUI6MXMnTQmEKyDN1eCIuIIc';
  
  console.log(`App ID: ${appId}`);
  console.log(`API Key: ${apiKey.substring(0, 8)}...`);
  
  // Test API call to Whop
  try {
    const response = await fetch('https://api.whop.com/api/v5/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ API Key is valid!');
      console.log('User info:', JSON.stringify(data, null, 2));
    } else {
      console.log('\n⚠️  API Key might be invalid or expired');
      console.log('Status:', response.status);
      console.log('You may need to create a new Whop Experience app');
    }
  } catch (error) {
    console.log('\n❌ API call failed:', error.message);
    console.log('This could be normal in development environment');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Go to https://dev.whop.com');
  console.log('2. Check if your app exists');
  console.log('3. If not, create new Experience app');
  console.log('4. Copy the Experience ID (exp_...)');
  console.log('5. Add to Vercel environment variables');
}

// Run if this script is executed directly
if (require.main === module) {
  checkWhopApp().catch(console.error);
}

module.exports = { checkWhopApp };
