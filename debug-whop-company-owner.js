// debug-whop-company-owner.js - Debug Company Owner Detection in Production
console.log('🔍 Debugging Company Owner Detection in Whop...\n');

async function debugWhopCompanyOwner() {
  const productionURL = 'https://challenges-whop-app-sqmr.vercel.app';
  
  try {
    console.log('1. 🔍 Testing Production Company Owner Detection...');
    const companyOwnerResponse = await fetch(`${productionURL}/api/debug/company-owner`);
    
    if (companyOwnerResponse.ok) {
      const data = await companyOwnerResponse.json();
      console.log('Company Owner Debug Result:', JSON.stringify(data, null, 2));
      
      if (data.ownershipCheck?.isOwner) {
        console.log('✅ COMPANY OWNER DETECTED - System should grant admin access');
      } else {
        console.log('❌ NOT RECOGNIZED AS COMPANY OWNER');
        console.log('Possible issues:');
        console.log('- Whop headers not being passed correctly');
        console.log('- User ID extraction failing');
        console.log('- Company API call failing');
        console.log('- Wrong company ID configuration');
      }
    } else {
      console.log('❌ Company owner debug endpoint failed:', companyOwnerResponse.status);
    }
    
    console.log('\n2. 🔍 Testing Experience Context Detection...');
    const experienceResponse = await fetch(`${productionURL}/api/debug/experience-context`);
    
    if (experienceResponse.ok) {
      const experienceData = await experienceResponse.json();
      console.log('Experience Context:', JSON.stringify(experienceData, null, 2));
      
      if (experienceData.userId && experienceData.companyId) {
        console.log('✅ Experience context detected - user should be authenticated');
      } else {
        console.log('❌ No experience context - user not in Whop iframe');
      }
    }
    
    console.log('\n3. 🔍 Testing Direct Auth Status...');
    const authResponse = await fetch(`${productionURL}/api/auth/whop/status`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Auth Status:', JSON.stringify(authData, null, 2));
    } else {
      console.log('❌ Auth status check failed:', authResponse.status);
    }
    
    console.log('\n🛠️ DEBUGGING SUMMARY:');
    console.log('If you\'re getting "Access Denied":');
    console.log('1. Check if you\'re accessing via the correct Whop app URL');
    console.log('2. Ensure you\'re logged into Whop as the company owner');
    console.log('3. Verify the app is installed in your company');
    console.log('4. Check Whop headers are being passed correctly');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugWhopCompanyOwner();
