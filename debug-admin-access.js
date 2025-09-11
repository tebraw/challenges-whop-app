#!/usr/bin/env node

/**
 * 🐛 ADMIN ACCESS DEBUG SCRIPT
 * Debug why admin access is failing
 */

console.log('🔍 ADMIN ACCESS DEBUG - Starting...\n');

// Test Experience Context API
async function testExperienceContext() {
  console.log('📡 Testing Experience Context API...');
  
  const testUrl = 'https://challenges-whop-app-sqmr-1ij036f1i-filip-grujicics-projects.vercel.app/api/auth/experience-context';
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug/1.0',
        // Simulate Whop headers
        'x-whop-company-id': 'biz_YoIIIT73rXwrtK',
        'x-experience-id': 'exp_wr9tbkUyeL1Oi5',
        'x-whop-user-id': 'user_11HQI5KrNDW1S'
      }
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));
    
    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Experience Context Test Failed:', error);
    return null;
  }
}

// Test Admin Challenges API
async function testAdminChallenges() {
  console.log('\n📡 Testing Admin Challenges API...');
  
  const testUrl = 'https://challenges-whop-app-sqmr-1ij036f1i-filip-grujicics-projects.vercel.app/api/admin/challenges';
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug/1.0',
        // Simulate Whop headers
        'x-whop-company-id': 'biz_YoIIIT73rXwrtK',
        'x-experience-id': 'exp_wr9tbkUyeL1Oi5',
        'x-whop-user-id': 'user_11HQI5KrNDW1S',
        'x-whop-user-token': 'test_token_placeholder'
      }
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));
    
    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Admin Challenges Test Failed:', error);
    return null;
  }
}

// Run tests
async function runDebug() {
  console.log('🎯 DEBUGGING ADMIN ACCESS ISSUES\n');
  
  console.log('1. Test Experience Context API');
  const contextResult = await testExperienceContext();
  
  console.log('\n2. Test Admin Challenges API');
  const adminResult = await testAdminChallenges();
  
  console.log('\n📊 SUMMARY:');
  console.log('Experience Context OK:', !!contextResult && !contextResult.error);
  console.log('Admin Challenges OK:', !!adminResult && !adminResult.error);
  
  if (contextResult?.error) {
    console.log('❌ Experience Context Error:', contextResult.error);
  }
  
  if (adminResult?.error) {
    console.log('❌ Admin Challenges Error:', adminResult.error);
  }
  
  console.log('\n🎯 LIKELY ISSUES:');
  console.log('- Missing Whop headers in browser');
  console.log('- Experience ID not found in environment');
  console.log('- Token verification failing');
  console.log('- Company/Experience mismatch');
}

runDebug();
