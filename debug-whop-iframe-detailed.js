// Test script to check what specific error is causing the "Something went wrong" page
const https = require('https');

async function testMainPageWithDetailedHeaders() {
  console.log('🔍 Testing Main Page with Real Whop Headers...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'challenges-whop-app-sqmr.vercel.app',
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'WhopIframe/1.0 (compatible; Whop App Browser)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Referer': 'https://whop.com/',
        'Origin': 'https://whop.com',
        
        // Whop specific headers that would be sent in iframe
        'X-Whop-Experience-Id': 'exp_FGHIJklmnop',
        'X-Whop-Company-Id': 'biz_ABCDEfghijk',  
        'X-Whop-User-Id': 'user_123456789',
        'X-Whop-User-Token': 'wut_faketoken123456789',
        
        // Additional headers Whop might send
        'X-Whop-App-Id': 'app_ZYUHlzHinpA5Ce',
        'X-Frame-Options': 'ALLOWALL',
        'X-Content-Type-Options': 'nosniff'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      // Handle chunked encoding
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Response Analysis:');
        console.log('Status Code:', res.statusCode);
        console.log('Status Message:', res.statusMessage);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        
        if (res.statusCode === 500) {
          console.log('❌ SERVER ERROR DETECTED!');
          console.log('This is likely causing the "Something went wrong" error');
        } else if (res.statusCode === 302 || res.statusCode === 307) {
          console.log('🔄 REDIRECT to:', res.headers.location);
          console.log('This redirect might be causing issues if Whop iframe can\'t follow it');
        } else if (res.statusCode === 200) {
          console.log('✅ SUCCESS Response');
          if (data.includes('Something went wrong')) {
            console.log('❌ But contains "Something went wrong" error page');
          }
        }
        
        console.log('\n📄 Response Body Length:', data.length, 'characters');
        
        // Check for specific error indicators
        if (data.includes('500')) {
          console.log('❌ Contains server error indicator');
        }
        if (data.includes('error')) {
          console.log('⚠️ Contains error keyword');
        }
        if (data.includes('<!DOCTYPE html>')) {
          console.log('✅ Valid HTML response');
        }
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request Error:', error.message);
      reject(error);
    });
    
    req.setTimeout(20000, () => {
      console.log('⏰ Request Timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testDirectDiscoverPage() {
  console.log('\n🔍 Testing /discover Page Directly...');
  
  return new Promise((resolve, reject) => {
    const req = https.get('https://challenges-whop-app-sqmr.vercel.app/discover', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('📊 Discover Page Response:');
        console.log('Status:', res.statusCode);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Body Length:', data.length);
        
        if (res.statusCode === 200) {
          console.log('✅ Discover page loads successfully');
        } else {
          console.log('❌ Discover page has issues:', res.statusCode);
        }
        
        resolve(data);
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function runIframeTest() {
  console.log('🚀 Testing Whop Iframe Integration...\n');
  
  try {
    const mainPageResult = await testMainPageWithDetailedHeaders();
    console.log('\n' + '='.repeat(80));
    
    await testDirectDiscoverPage();
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('1. If main page returns 307 redirect → Check if iframe can follow redirects');
    console.log('2. If main page returns 500 error → Check server logs for runtime errors');
    console.log('3. If discover page fails → That\'s where the redirect leads');
    console.log('4. Check if Whop iframe restrictions prevent certain redirects');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

runIframeTest();