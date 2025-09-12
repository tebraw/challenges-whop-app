// analyze-v2-memberships.js
// Analyze v2 memberships data for user-company mapping

const apiKey = 'ZuEYgRPbg-AiKVSuSZihLqPk08wOaI-xBIuGNTuAZNU';

async function analyzeMemberships() {
  console.log('🔍 ANALYZING v2 MEMBERSHIPS DATA...\n');
  
  try {
    const response = await fetch('https://api.whop.com/v2/memberships', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Got memberships data:');
      console.log('📊 Structure:', Object.keys(data));
      console.log(`📈 Total memberships: ${data.data?.length || 0}`);
      console.log('');
      
      if (data.data && data.data.length > 0) {
        console.log('🔍 SAMPLE MEMBERSHIP:');
        const sample = data.data[0];
        console.log(JSON.stringify(sample, null, 2));
        console.log('');
        
        console.log('🎯 USER-COMPANY MAPPING:');
        console.log('='.repeat(50));
        
        // Group by users
        const userMap = new Map();
        
        data.data.forEach(membership => {
          const userId = membership.user?.id || membership.user_id;
          const userEmail = membership.user?.email;
          const companyId = membership.company || membership.company_id;
          
          if (userId) {
            if (!userMap.has(userId)) {
              userMap.set(userId, {
                email: userEmail,
                companies: new Set(),
                memberships: []
              });
            }
            
            const userData = userMap.get(userId);
            if (companyId) {
              userData.companies.add(companyId);
            }
            userData.memberships.push(membership);
          }
        });
        
        console.log(`👥 Found ${userMap.size} unique users:`);
        
        let userCount = 0;
        for (const [userId, userData] of userMap) {
          userCount++;
          if (userCount <= 10) { // Show first 10 users
            console.log(`\n${userCount}. User: ${userId}`);
            console.log(`   📧 Email: ${userData.email || 'N/A'}`);
            console.log(`   🏢 Companies: ${Array.from(userData.companies).join(', ') || 'None'}`);
            console.log(`   📊 Memberships: ${userData.memberships.length}`);
            
            // Show membership details
            userData.memberships.slice(0, 2).forEach((membership, i) => {
              console.log(`     ${i+1}. Product: ${membership.product?.id || membership.product_id || 'N/A'}`);
              console.log(`        Status: ${membership.status || 'N/A'}`);
              console.log(`        Valid: ${membership.valid || 'N/A'}`);
            });
          }
        }
        
        if (userCount > 10) {
          console.log(`\n... and ${userCount - 10} more users`);
        }
        
        console.log('\n🎯 COMPANY DETECTION POSSIBILITY:');
        console.log('='.repeat(50));
        
        // Check if we can map users to companies
        let usersWithCompanies = 0;
        for (const [userId, userData] of userMap) {
          if (userData.companies.size > 0) {
            usersWithCompanies++;
          }
        }
        
        console.log(`✅ Users with company data: ${usersWithCompanies}/${userMap.size}`);
        
        if (usersWithCompanies > 0) {
          console.log('🎉 WE CAN IMPLEMENT REAL COMPANY DETECTION!');
          console.log('💡 Strategy: Use v2 memberships API to map User ID → Company ID');
        } else {
          console.log('❌ No company data in memberships');
          console.log('💡 Keep current unique-company-per-user solution');
        }
        
      } else {
        console.log('📭 No memberships data found');
      }
    } else {
      console.log('❌ Failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
  }
}

analyzeMemberships().catch(console.error);