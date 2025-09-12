// experience-to-company-detection.js
// Use Experience ID to find out which company owns it

require('dotenv').config();

async function detectCompanyFromExperience() {
  console.log('🔍 DETECTIVE WORK: Experience ID → Company Detection...\n');

  // Get Experience ID from environment or headers
  const experienceId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  
  console.log(`🎯 Target Experience ID: ${experienceId}`);
  console.log(`🔑 Using API Key: ${process.env.WHOP_API_KEY?.substring(0, 20)}...`);
  console.log('');

  try {
    // Test 1: Get Experience Details
    console.log('📋 STEP 1: Get Experience Details');
    console.log('='.repeat(50));
    
    const experienceResponse = await fetch(`https://api.whop.com/v5/experiences/${experienceId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${experienceResponse.status} ${experienceResponse.statusText}`);
    
    if (experienceResponse.ok) {
      const experienceData = await experienceResponse.json();
      console.log('✅ SUCCESS! Experience API works!');
      console.log('📊 Experience Data:');
      console.log(JSON.stringify(experienceData, null, 2));
      
      // Look for company information in experience data
      if (experienceData.company_id || experienceData.company || experienceData.owner) {
        console.log('\n🎯 FOUND COMPANY INFO IN EXPERIENCE!');
        const companyInfo = {
          company_id: experienceData.company_id,
          company: experienceData.company,
          owner: experienceData.owner,
          owner_id: experienceData.owner_id
        };
        console.log('🏢 Company Info:', companyInfo);
        
        // If we have a company ID, get company details
        if (experienceData.company_id) {
          console.log('\n📋 STEP 2: Get Company Details');
          console.log('='.repeat(50));
          
          const companyResponse = await fetch(`https://api.whop.com/v5/companies/${experienceData.company_id}`, {
            headers: {
              'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`Company API Status: ${companyResponse.status}`);
          
          if (companyResponse.ok) {
            const companyData = await companyResponse.json();
            console.log('✅ SUCCESS! Got Company Data!');
            console.log('🏢 Company Details:');
            console.log(JSON.stringify(companyData, null, 2));
          } else {
            console.log('❌ Company API failed');
            console.log('Error:', await companyResponse.text());
          }
        }
      } else {
        console.log('\n📭 No company information found in experience data');
      }
      
    } else {
      console.log('❌ Experience API failed');
      const errorText = await experienceResponse.text();
      console.log('Error Details:', errorText);
    }

    // Test 2: List all experiences (to see structure)
    console.log('\n📋 STEP 3: List All Experiences (for reference)');
    console.log('='.repeat(50));
    
    const allExperiencesResponse = await fetch('https://api.whop.com/v5/experiences', {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`All Experiences Status: ${allExperiencesResponse.status}`);
    
    if (allExperiencesResponse.ok) {
      const allExperiences = await allExperiencesResponse.json();
      console.log('✅ Can list experiences!');
      console.log(`Found ${allExperiences.data?.length || 0} experiences`);
      
      if (allExperiences.data?.length > 0) {
        console.log('\n🔍 Experience Structure Analysis:');
        allExperiences.data.slice(0, 2).forEach((exp, i) => {
          console.log(`\nExperience ${i + 1}:`);
          console.log(`  ID: ${exp.id}`);
          console.log(`  Name: ${exp.name || 'N/A'}`);
          console.log(`  Company ID: ${exp.company_id || 'N/A'}`);
          console.log(`  Owner: ${exp.owner_id || 'N/A'}`);
          console.log(`  Type: ${exp.type || 'N/A'}`);
        });
      }
    } else {
      console.log('❌ Cannot list experiences');
    }

    // Test 3: Check if we can get user info from memberships
    console.log('\n📋 STEP 4: Check Memberships API');
    console.log('='.repeat(50));
    
    const membershipsResponse = await fetch(`https://api.whop.com/v5/memberships`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Memberships Status: ${membershipsResponse.status}`);
    
    if (membershipsResponse.ok) {
      const membershipsData = await membershipsResponse.json();
      console.log('✅ Memberships API works!');
      console.log(`Found ${membershipsData.data?.length || 0} memberships`);
      
      if (membershipsData.data?.length > 0) {
        console.log('\n👥 User-Company Relationships via Memberships:');
        const uniqueUsers = new Set();
        membershipsData.data.slice(0, 5).forEach(membership => {
          if (membership.user && !uniqueUsers.has(membership.user.id)) {
            uniqueUsers.add(membership.user.id);
            console.log(`User: ${membership.user.id} (${membership.user.email || 'N/A'})`);
            console.log(`  Company: ${membership.company_id || 'N/A'}`);
            console.log(`  Product: ${membership.product_id || 'N/A'}`);
            console.log(`  Status: ${membership.status || 'N/A'}`);
            console.log('');
          }
        });
      }
    } else {
      console.log('❌ Memberships API failed');
    }

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }

  console.log('\n🎯 ANALYSIS RESULTS:');
  console.log('='.repeat(50));
  console.log('If Experience API contains company_id → We can use that!');
  console.log('If Memberships show user-company relationships → We can map that!');
  console.log('Goal: Map User ID → Real Company ID → Real Company Name');
}

detectCompanyFromExperience().catch(console.error);