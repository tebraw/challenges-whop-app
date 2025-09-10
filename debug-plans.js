// Debug script to find all plans for all products
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

loadEnv();

async function findAllPlans() {
  console.log('🔍 Finding all plans and their product associations...');
  
  const WHOP_API_BASE = process.env.WHOP_API_BASE_URL || 'https://api.whop.com';
  const WHOP_API_KEY = process.env.WHOP_API_KEY;
  
  if (!WHOP_API_KEY) {
    console.log('❌ No API key found');
    return;
  }
  
  // Try to find plans via different endpoints
  const endpoints = [
    '/v5/company/memberships?per=100',
    '/v5/company/payments?per=100',
    '/api/v2/me/plans',
    '/api/v2/products',
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Trying: ${WHOP_API_BASE}${endpoint}`);
      
      const response = await fetch(`${WHOP_API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${WHOP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success:`, JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
}

findAllPlans();
