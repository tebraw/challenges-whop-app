#!/usr/bin/env node

console.log('🔍 Debugging Whop Headers for Company Owner Access...\n');

// Test the admin access endpoint to see what happens
const testUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/auth/onboarding-status`
  : 'https://challenges-fresh.vercel.app/api/auth/onboarding-status';

console.log(`Testing endpoint: ${testUrl}\n`);

// Simulate headers that Whop would send for a company owner
const mockHeaders = {
  'x-whop-user-id': 'user_123456789',
  'x-whop-company-id': 'biz_123456789', 
  'x-whop-access-level': 'admin',
  'x-whop-role': 'admin',
  'referer': 'https://whop.com/dashboard',
  'user-agent': 'Mozilla/5.0 WhopApp',
  'x-frame-options': 'ALLOWALL'
};

console.log('📤 Testing with mock company owner headers:');
Object.entries(mockHeaders).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});
console.log('');

// Test the endpoint
fetch(testUrl, {
  method: 'GET',
  headers: mockHeaders
})
.then(response => {
  console.log(`📡 Response Status: ${response.status}`);
  console.log('📋 Response Headers:');
  for (const [key, value] of response.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  return response.text();
})
.then(text => {
  console.log('\n📄 Response Body:');
  try {
    const json = JSON.parse(text);
    console.log(JSON.stringify(json, null, 2));
  } catch {
    console.log(text);
  }
})
.catch(error => {
  console.error('❌ Error:', error.message);
});

// Also test the root admin path
console.log('\n' + '='.repeat(50));
console.log('🏠 Testing admin root path...');

const adminUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/admin`
  : 'https://challenges-fresh.vercel.app/admin';

console.log(`Testing: ${adminUrl}\n`);

fetch(adminUrl, {
  method: 'GET',
  headers: mockHeaders
})
.then(response => {
  console.log(`📡 Admin Response Status: ${response.status}`);
  return response.text();
})
.then(text => {
  console.log('📄 Admin Response Preview:');
  console.log(text.substring(0, 500) + '...');
  
  // Check if it contains "Access Denied" or "onboarding"
  if (text.includes('Access Denied')) {
    console.log('❌ PROBLEM: Still showing Access Denied');
  } else if (text.includes('onboarding') || text.includes('subscribe')) {
    console.log('✅ SUCCESS: Showing onboarding flow');
  } else {
    console.log('❓ UNCLEAR: Response needs manual review');
  }
})
.catch(error => {
  console.error('❌ Admin Error:', error.message);
});
