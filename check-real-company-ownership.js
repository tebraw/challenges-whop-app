const { WhopServerSdk } = require('@whop/api');

async function checkRealCompanyOwnership() {
  console.log('🔍 CHECKING REAL COMPANY OWNERSHIP for Company: 9nmw5yleoqldrxf7n48c\n');
  
  const users = [
    { id: 'user_eGf5vVjIuGLSy', experience: 'exp_3wSpfXnrRl7puA' },
    { id: 'user_w3lVukX5x9ayO', experience: 'exp_Tj1OwPyPNw7p0S' }
  ];
  
  const companyId = '9nmw5yleoqldrxf7n48c';
  
  for (const user of users) {
    console.log(`📋 Analyzing User: ${user.id}`);
    console.log('─'.repeat(50));
    
    try {
      // Check if this user owns the company
      console.log('🏢 Checking company ownership...');
      
      const companyResponse = await fetch(`https://api.whop.com/v5/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        console.log(`   ✅ Company: ${companyData.name || 'No name'}`);
        console.log(`   └─ Owner ID: ${companyData.owner_id || 'Not found'}`);
        
        const isOwner = companyData.owner_id === user.id;
        console.log(`   └─ Is ${user.id} the owner? ${isOwner ? '✅ YES' : '❌ NO'}`);
        
        if (isOwner) {
          console.log('   🎯 COMPANY OWNER DETECTED!');
          console.log('   🛠️ Should be promoted to ADMIN role');
          console.log('   🏠 Should get company-based tenant');
        } else {
          console.log('   👤 Regular member/employee');
          console.log('   🎯 Should keep USER role');
          console.log('   🏠 Should get experience-based tenant');
        }
      } else {
        console.log(`   ❌ Failed to fetch company details: ${companyResponse.status}`);
        
        // Fallback: Check user's companies endpoint
        console.log('   🔄 Trying user companies endpoint...');
        const userCompaniesResponse = await fetch(`https://api.whop.com/v5/users/${user.id}/companies`, {
          headers: {
            'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userCompaniesResponse.ok) {
          const userCompanies = await userCompaniesResponse.json();
          const ownedCompanies = userCompanies.data || [];
          
          const ownsThisCompany = ownedCompanies.some(c => c.id === companyId);
          console.log(`   └─ Owns company ${companyId}? ${ownsThisCompany ? '✅ YES' : '❌ NO'}`);
          
          if (ownsThisCompany) {
            console.log('   🎯 COMPANY OWNER DETECTED via user companies!');
          }
        } else {
          console.log(`   ❌ User companies check also failed: ${userCompaniesResponse.status}`);
        }
      }
      
      // Get experience details
      console.log(`\n🎭 Experience details for ${user.experience}...`);
      const experienceResponse = await fetch(`https://api.whop.com/v5/experiences/${user.experience}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (experienceResponse.ok) {
        const experienceData = await experienceResponse.json();
        console.log(`   ✅ Experience: ${experienceData.name || 'No name'}`);
        console.log(`   └─ Company: ${experienceData.company_id || 'Not found'}`);
      } else {
        console.log(`   ❌ Failed to fetch experience: ${experienceResponse.status}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error checking user ${user.id}:`, error.message);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  console.log('🎯 RECOMMENDED ACTION:');
  console.log('1. Identify the company owner via API');
  console.log('2. Promote company owner to ADMIN role');
  console.log('3. Create separate tenant for company owner');
  console.log('4. Keep experience members as USER role');
  console.log('5. Create separate tenants for each experience');
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

if (!process.env.WHOP_API_KEY) {
  console.error('❌ WHOP_API_KEY not found in environment variables');
  console.log('\nPlease set up .env.local with:');
  console.log('WHOP_API_KEY=your_whop_api_key');
  process.exit(1);
}

checkRealCompanyOwnership().catch(console.error);