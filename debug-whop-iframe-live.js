// Debug script to analyze live Whop iframe issues
const https = require('https');

const PRODUCTION_URL = 'https://challenges-whop-app-sqmr.vercel.app';

async function testProductionHealthCheck() {
  console.log('🔍 Testing Production Health Check...');
  
  return new Promise((resolve, reject) => {
    const req = https.get(`${PRODUCTION_URL}/api/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('✅ Health Check Response:');
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', data);
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Health Check Error:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log('⏰ Health Check Timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function testWithWhopHeaders() {
  console.log('\n🔍 Testing with Whop Headers...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'challenges-whop-app-sqmr.vercel.app',
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Whop-Iframe/1.0',
        'X-Whop-Experience-Id': 'exp_test123',
        'X-Whop-Company-Id': 'biz_test123',
        'X-Whop-User-Id': 'user_test123',
        'X-Whop-User-Token': 'dummy_token_test',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://whop.com/',
        'Origin': 'https://whop.com'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('✅ Whop Header Test Response:');
        console.log('Status:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        
        if (res.statusCode === 302 || res.statusCode === 301) {
          console.log('🔄 Redirect to:', res.headers.location);
        } else if (res.statusCode === 200) {
          console.log('📄 Response size:', data.length, 'chars');
          if (data.includes('Something went wrong')) {
            console.log('❌ ERROR PAGE DETECTED in response');
          } else if (data.includes('<!DOCTYPE html>')) {
            console.log('✅ Valid HTML response');
          }
        } else {
          console.log('⚠️ Unexpected status code');
        }
        
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Whop Header Test Error:', error.message);
      reject(error);
    });
    
    req.setTimeout(15000, () => {
      console.log('⏰ Whop Header Test Timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

async function testEnvironmentVariables() {
  console.log('\n🔍 Testing Environment Variables Endpoint...');
  
  return new Promise((resolve, reject) => {
    const req = https.get(`${PRODUCTION_URL}/api/debug/env`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('📊 Environment Variables Check:');
        console.log('Status:', res.statusCode);
        
        if (res.statusCode === 200) {
          try {
            const envData = JSON.parse(data);
            console.log('✅ Whop credentials configured:', {
              hasClientId: !!envData.WHOP_CLIENT_ID,
              hasClientSecret: !!envData.WHOP_CLIENT_SECRET,
              hasWebhookSecret: !!envData.WHOP_WEBHOOK_SECRET,
              hasDatabaseUrl: !!envData.DATABASE_URL
            });
          } catch (error) {
            console.log('❌ Failed to parse env response:', data);
          }
        } else {
          console.log('❌ Env endpoint error:', data);
        }
        
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Env Test Error:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

async function runDiagnostics() {
  console.log('🚀 Starting Live Production Diagnostics...\n');
  
  try {
    await testProductionHealthCheck();
  } catch (error) {
    console.log('Health check failed:', error.message);
  }
  
  try {
    await testEnvironmentVariables();
  } catch (error) {
    console.log('Environment check failed:', error.message);
  }
  
  try {
    await testWithWhopHeaders();
  } catch (error) {
    console.log('Whop header test failed:', error.message);
  }
  
  console.log('\n🎯 Diagnosis Complete');
  console.log('\nNext Steps:');
  console.log('1. Check Vercel deployment logs for any runtime errors');
  console.log('2. Verify environment variables are properly set in Vercel');
  console.log('3. Test actual Whop iframe with real user credentials');
  console.log('4. Check if database connection is working in production');
}

runDiagnostics().catch(console.error);