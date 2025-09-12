const { WhopServerSdk } = require('@whop/api');

// Initialize Whop SDK
const whopSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
  appApiKey: process.env.WHOP_API_KEY ?? "fallback"
});

async function analyzeUserCompanies() {
  console.log('🔍 ANALYZING USER COMPANY OWNERSHIP via Whop API\n');
  
  // Current users from database
  const currentUsers = [
    'user_eGf5vVjIuGLSy',
    'user_w3lVukX5x9ayO'
  ];
  
  for (const userId of currentUsers) {
    console.log(`📋 Analyzing User: ${userId}`);
    console.log('─'.repeat(50));
    
    try {
      // 1. Get user details
      console.log('1️⃣ Fetching user details...');
      const userResponse = await fetch(`https://api.whop.com/v5/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log(`   ✅ User: ${userData.email || 'No email'}`);
        console.log(`   └─ Username: ${userData.username || 'No username'}`);
      } else {
        console.log(`   ❌ Failed to fetch user: ${userResponse.status}`);
      }
      
      // 2. Get companies owned by this user
      console.log('\n2️⃣ Fetching owned companies...');
      const companiesResponse = await fetch(`https://api.whop.com/v5/users/${userId}/companies`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const ownedCompanies = companiesData.data || [];
        
        console.log(`   📊 Owned Companies: ${ownedCompanies.length}`);
        
        if (ownedCompanies.length > 0) {
          console.log('   🏢 COMPANY OWNER DETECTED!');
          ownedCompanies.forEach((company, index) => {
            console.log(`   ${index + 1}. Company ID: ${company.id}`);
            console.log(`      └─ Name: ${company.name || 'No name'}`);
            console.log(`      └─ Status: ${company.status || 'Unknown'}`);
          });
          
          console.log(`   🎯 ROLE: ADMIN (Company Owner)`);
          console.log(`   🏠 TENANT: Should be "Company ${ownedCompanies[0].id}"`);
        } else {
          console.log('   👤 No owned companies - regular member');
          console.log('   🎯 ROLE: USER (Community Member)');
        }
      } else {
        console.log(`   ❌ Failed to fetch companies: ${companiesResponse.status}`);
      }
      
      // 3. Get memberships (what they have access to)
      console.log('\n3️⃣ Fetching memberships...');
      const membershipsResponse = await fetch(`https://api.whop.com/v5/users/${userId}/memberships`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (membershipsResponse.ok) {
        const membershipsData = await membershipsResponse.json();
        const memberships = membershipsData.data || [];
        
        console.log(`   📊 Active Memberships: ${memberships.length}`);
        
        memberships.forEach((membership, index) => {
          console.log(`   ${index + 1}. Membership ID: ${membership.id}`);
          console.log(`      └─ Company: ${membership.company?.id || 'Unknown'}`);
          console.log(`      └─ Product: ${membership.product?.id || 'Unknown'}`);
          console.log(`      └─ Status: ${membership.status}`);
          console.log(`      └─ Valid: ${membership.valid ? 'Yes' : 'No'}`);
        });
      } else {
        console.log(`   ❌ Failed to fetch memberships: ${membershipsResponse.status}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error analyzing user ${userId}:`, error.message);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  console.log('🎯 NEXT STEPS:');
  console.log('1. Identify which users are Company Owners');
  console.log('2. Create separate tenants for each Company Owner');
  console.log('3. Update user roles based on company ownership');
  console.log('4. Test admin access with correct company context');
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

if (!process.env.WHOP_API_KEY) {
  console.error('❌ WHOP_API_KEY not found in environment variables');
  console.log('Make sure you have .env.local with WHOP_API_KEY set');
  process.exit(1);
}

analyzeUserCompanies().catch(console.error);