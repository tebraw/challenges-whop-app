const { WhopAPI } = require("@whop/sdk");

async function analyzeWhopSDK() {
  console.log('🔍 Analyzing Whop SDK data...\n');
  
  // Try different ways to initialize the SDK
  const apiKey = 'xGCaKZ6n2xk4ZjdhNphMUI6MXMnTQmEKyDN1eCIuIIc';
  const companyId = 'biz_YoIIIT73rXwrtK';
  const appId = 'app_ZYUHlzHinpA5Ce';
  
  console.log('🔑 Using credentials:');
  console.log(`   API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`   Company ID: ${companyId}`);
  console.log(`   App ID: ${appId}\n`);
  
  try {
    // Initialize SDK
    const whop = new WhopAPI({
      accessToken: apiKey
    });
    
    console.log('============================================================');
    console.log('📡 Testing: Get Current User');
    try {
      const user = await whop.users.retrieve({
        id: 'user_Z9GOqqGEJWyjG'
      });
      console.log('✅ SUCCESS');
      console.log('User Data:', JSON.stringify(user, null, 2));
    } catch (error) {
      console.log('❌ FAILED');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response:', error.response.data);
      }
    }
    
    console.log('\n============================================================');
    console.log('📡 Testing: Get Company Details');
    try {
      const company = await whop.companies.retrieve({
        id: companyId
      });
      console.log('✅ SUCCESS');
      console.log('Company Data:', JSON.stringify(company, null, 2));
      
      // Look for handle/username fields
      console.log('\n🎯 URL-relevant fields found:');
      if (company.handle) console.log(`   Handle: ${company.handle}`);
      if (company.username) console.log(`   Username: ${company.username}`);
      if (company.name) console.log(`   Name: ${company.name}`);
      if (company.slug) console.log(`   Slug: ${company.slug}`);
      
    } catch (error) {
      console.log('❌ FAILED');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response:', error.response.data);
      }
    }
    
    console.log('\n============================================================');
    console.log('📡 Testing: Get Company Products');
    try {
      const products = await whop.companies.listProducts({
        id: companyId
      });
      console.log('✅ SUCCESS');
      console.log('Products Data:', JSON.stringify(products, null, 2));
      
      if (products.data && products.data.length > 0) {
        console.log('\n🎯 Product IDs found:');
        products.data.forEach((product, index) => {
          console.log(`   Product ${index + 1}: ${product.id} (${product.title || 'No title'})`);
        });
      }
      
    } catch (error) {
      console.log('❌ FAILED');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response:', error.response.data);
      }
    }
    
    console.log('\n============================================================');
    console.log('📡 Testing: List All Companies for User');
    try {
      const companies = await whop.users.listCompanies({
        id: 'user_Z9GOqqGEJWyjG'
      });
      console.log('✅ SUCCESS');
      console.log('Companies Data:', JSON.stringify(companies, null, 2));
      
      if (companies.data && companies.data.length > 0) {
        console.log('\n🎯 All companies for this user:');
        companies.data.forEach((company, index) => {
          console.log(`   Company ${index + 1}: ${company.id} - ${company.name || 'No name'}`);
          if (company.handle) console.log(`     Handle: ${company.handle}`);
          if (company.username) console.log(`     Username: ${company.username}`);
        });
      }
      
    } catch (error) {
      console.log('❌ FAILED');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response:', error.response.data);
      }
    }
    
  } catch (error) {
    console.log('❌ SDK Initialization failed:', error.message);
  }
  
  console.log('\n🎯 SUMMARY: Whop SDK Analysis Complete!');
}

analyzeWhopSDK().catch(console.error);