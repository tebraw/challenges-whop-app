#!/usr/bin/env node

/**
 * Whop URL Configuration Checker
 * Helps diagnose and fix Cloudflare 1003 errors
 */

async function checkWhopUrls() {
  console.log('🔍 Whop URL Configuration Checker\n');
  
  const correctUrls = {
    'App URL': 'https://challenges-whop-app-sqmr.vercel.app',
    'OAuth Redirect': 'https://challenges-whop-app-sqmr.vercel.app/api/auth/whop/callback',
    'Webhook URL': 'https://challenges-whop-app-sqmr.vercel.app/api/whop/webhook',
    'Experience URL': 'https://challenges-whop-app-sqmr.vercel.app/experience',
    'iFrame URL': 'https://challenges-whop-app-sqmr.vercel.app'
  };
  
  console.log('✅ Correct URLs for Whop Dashboard:\n');
  Object.entries(correctUrls).forEach(([key, url]) => {
    console.log(`${key}: ${url}`);
  });
  
  console.log('\n🚨 Common Cloudflare 1003 Causes:');
  console.log('1. Using IP address instead of domain name');
  console.log('2. Wrong Host header in Whop configuration');
  console.log('3. Outdated URLs in Whop Dashboard');
  
  console.log('\n🔧 Fix Steps:');
  console.log('1. Go to Whop Developer Dashboard');
  console.log('2. Find your Experience app');
  console.log('3. Update ALL URLs to use vercel.app domain');
  console.log('4. Make sure NO IP addresses are used');
  console.log('5. Save and test again');
  
  console.log('\n🧪 Test URL:');
  console.log('Direct access: https://challenges-whop-app-sqmr.vercel.app');
  
  // Test the main URL
  try {
    console.log('\n🌐 Testing main URL...');
    const response = await fetch('https://challenges-whop-app-sqmr.vercel.app');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
    
    if (response.ok) {
      console.log('✅ Main URL works correctly');
    } else {
      console.log('❌ Main URL has issues');
    }
  } catch (error) {
    console.error('❌ URL test failed:', error.message);
  }
}

// Run the checker
if (require.main === module) {
  checkWhopUrls();
}

module.exports = { checkWhopUrls };
