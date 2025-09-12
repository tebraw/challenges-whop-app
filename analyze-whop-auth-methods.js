// Whop API Authentication Analysis
// Check how we're using API Keys vs OAuth and what access we have

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeWhopAuthentication() {
  console.log('🔐 WHOP API AUTHENTICATION ANALYSIS\n');
  
  console.log('📋 ENVIRONMENT VARIABLES:');
  console.log(`WHOP_API_KEY: ${process.env.WHOP_API_KEY ? 'SET (' + process.env.WHOP_API_KEY.substring(0, 10) + '...)' : 'NOT SET'}`);
  console.log(`NEXT_PUBLIC_WHOP_APP_ID: ${process.env.NEXT_PUBLIC_WHOP_APP_ID || 'NOT SET'}`);
  console.log(`NEXT_PUBLIC_WHOP_COMPANY_ID: ${process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'NOT SET'}`);
  console.log(`WHOP_CLIENT_ID: ${process.env.WHOP_CLIENT_ID || 'NOT SET'}`);
  console.log(`WHOP_CLIENT_SECRET: ${process.env.WHOP_CLIENT_SECRET ? 'SET' : 'NOT SET'}\n`);
  
  console.log('🧪 TESTING API KEY ACCESS:\n');
  
  // Test API Key access with different endpoints
  const apiTests = [
    {
      name: 'V5 Me (OAuth style)',
      url: 'https://api.whop.com/v5/me',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'V5 Me with App ID',
      url: 'https://api.whop.com/v5/me',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Whop-App-Id': process.env.NEXT_PUBLIC_WHOP_APP_ID
      }
    },
    {
      name: 'V2 Memberships',
      url: 'https://api.whop.com/v2/memberships',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'V5 Company Info',
      url: `https://api.whop.com/v5/companies/${process.env.NEXT_PUBLIC_WHOP_COMPANY_ID}`,
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  ];
  
  for (const test of apiTests) {
    console.log(`🔍 Testing: ${test.name}`);
    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: test.headers
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS - Data available`);
        if (data.id) console.log(`   ID: ${data.id}`);
        if (data.email) console.log(`   Email: ${data.email}`);
        if (data.data && Array.isArray(data.data)) {
          console.log(`   Array Length: ${data.data.length}`);
        }
      } else {
        console.log(`   ❌ FAILED`);
        if (response.status === 401) {
          console.log(`   → Authentication issue`);
        } else if (response.status === 403) {
          console.log(`   → Permission/scope issue`);
        } else if (response.status === 404) {
          console.log(`   → Not found or wrong endpoint`);
        }
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🔑 AUTHENTICATION METHOD ANALYSIS:\n');
  
  console.log('📝 Current Implementation:');
  console.log('   - Using API Key in Authorization header');
  console.log('   - Format: Bearer {API_KEY}');
  console.log('   - Scope: Limited to API key permissions\n');
  
  console.log('🤔 POTENTIAL ISSUES:');
  console.log('   1. API Key vs OAuth Token confusion');
  console.log('   2. Different endpoints require different auth methods');
  console.log('   3. Company-specific data access limitations');
  console.log('   4. User session tokens vs server API keys\n');
  
  console.log('💡 RECOMMENDATIONS:');
  console.log('   1. Check if we need OAuth flow for user-specific data');
  console.log('   2. Verify API key has correct scopes');
  console.log('   3. Test with actual user session tokens');
  console.log('   4. Consider hybrid auth approach\n');
  
  // Test current user authentication flow
  console.log('👤 USER AUTHENTICATION FLOW TEST:\n');
  
  // Check current users and their tokens
  const users = await prisma.user.findMany({
    select: {
      email: true,
      whopUserId: true,
      role: true,
      whopCompanyId: true
    }
  });
  
  console.log(`Found ${users.length} users in database:`);
  users.forEach(user => {
    console.log(`   👤 ${user.email} (${user.whopUserId}) - ${user.whopCompanyId}`);
  });
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('   1. Test with OAuth tokens if available');
  console.log('   2. Check session-based authentication');
  console.log('   3. Verify company-user relationships');
  console.log('   4. Test isolation with proper auth');
}

analyzeWhopAuthentication()
  .catch(console.error)
  .finally(() => prisma.$disconnect());