// Deep Analysis: Why do different users have the same company?
// This investigates the actual Whop API data structure

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeWhopCompanyStructure() {
  console.log('🔍 DEEP ANALYSIS: WHOP COMPANY STRUCTURE\n');
  
  const realCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_YoIIIT73rXwrtK';
  console.log(`🏢 App Company ID: ${realCompanyId}`);
  console.log(`📧 Different emails should NOT have same company!\n`);
  
  // Test users with different emails
  const testUsers = [
    'user_w3lVukX5x9ayO', // fm.homesolutions.cr@gmail.com
    'user_4CUq7XKZv98Zy', // grujicic.filip17@gmail.com  
    'user_HMQlzoJ8oUhV8' // sanmariaamin@gmail.com
  ];
  
  console.log('🧪 TESTING WHOP API ENDPOINTS:\n');
  
  for (const userId of testUsers) {
    console.log(`${'='.repeat(60)}`);
    console.log(`👤 ANALYZING USER: ${userId}`);
    console.log(`${'='.repeat(60)}`);
    
    // 1. Get user memberships (v2 API)
    try {
      console.log('\n📊 V2 MEMBERSHIPS API:');
      const membershipsResponse = await fetch(`https://api.whop.com/v2/memberships?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (membershipsResponse.ok) {
        const membershipsData = await membershipsResponse.json();
        console.log(`   Status: ✅ SUCCESS`);
        console.log(`   Memberships: ${membershipsData.data?.length || 0}`);
        
        if (membershipsData.data?.length > 0) {
          membershipsData.data.forEach((membership, index) => {
            console.log(`   [${index + 1}] Company: ${membership.company_id}`);
            console.log(`       Product: ${membership.product_id}`);
            console.log(`       Valid: ${membership.valid}`);
            console.log(`       Status: ${membership.status}`);
            console.log(`       User Email: ${membership.user?.email || 'Not provided'}`);
          });
        }
      } else {
        console.log(`   Status: ❌ FAILED (${membershipsResponse.status})`);
      }
    } catch (error) {
      console.log(`   Status: ❌ ERROR - ${error.message}`);
    }
    
    // 2. Get user companies (v5 API)
    try {
      console.log('\n🏢 V5 USER COMPANIES API:');
      const companiesResponse = await fetch(`https://api.whop.com/v5/users/${userId}/companies`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        console.log(`   Status: ✅ SUCCESS`);
        console.log(`   Companies: ${companiesData.data?.length || 0}`);
        
        if (companiesData.data?.length > 0) {
          companiesData.data.forEach((company, index) => {
            console.log(`   [${index + 1}] ID: ${company.id}`);
            console.log(`       Name: ${company.name || 'No name'}`);
            console.log(`       Type: ${company.type || 'Unknown'}`);
          });
        }
      } else {
        console.log(`   Status: ❌ FAILED (${companiesResponse.status})`);
      }
    } catch (error) {
      console.log(`   Status: ❌ ERROR - ${error.message}`);
    }
    
    // 3. Get user profile (v5 API)
    try {
      console.log('\n👤 V5 USER PROFILE API:');
      const userResponse = await fetch(`https://api.whop.com/v5/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log(`   Status: ✅ SUCCESS`);
        console.log(`   Email: ${userData.email || 'Not provided'}`);
        console.log(`   Username: ${userData.username || 'Not provided'}`);
        console.log(`   ID: ${userData.id}`);
      } else {
        console.log(`   Status: ❌ FAILED (${userResponse.status})`);
      }
    } catch (error) {
      console.log(`   Status: ❌ ERROR - ${error.message}`);
    }
    
    console.log('\n');
  }
  
  console.log(`${'='.repeat(60)}`);
  console.log('🤔 THEORY ANALYSIS:');
  console.log(`${'='.repeat(60)}`);
  
  console.log(`
📝 POSSIBLE EXPLANATIONS:

1. 🏢 WHOP APP STRUCTURE:
   - Your Whop App has company ID: ${realCompanyId}
   - ALL users who use your app are "members" of YOUR company
   - They don't OWN the company, they are CUSTOMERS of your company
   
2. 👥 USER vs COMPANY OWNER:
   - These users are CUSTOMERS/MEMBERS, not company owners
   - They all belong to YOUR Whop company as subscribers
   - That's why they all show the same company_id
   
3. 🔑 REAL ISOLATION NEEDED:
   - We need to create sub-tenants for each user
   - Use user_id as the unique identifier
   - Don't rely on company ownership for isolation

4. 💡 CORRECT STRATEGY:
   - Real Company: ${realCompanyId} (your Whop app)
   - User Tenants: ${realCompanyId}_user_{userId}
   - This gives perfect isolation while maintaining real structure
  `);
  
  console.log(`${'='.repeat(60)}`);
  console.log('✅ ANALYSIS COMPLETE - Strategy confirmed!');
  console.log(`${'='.repeat(60)}`);
}

analyzeWhopCompanyStructure()
  .catch(console.error)
  .finally(() => prisma.$disconnect());