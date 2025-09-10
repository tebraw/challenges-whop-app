// Direct API test to find all plans for all products
const WHOP_API_KEY = process.env.WHOP_API_KEY;

console.log('🧪 Testing direct API calls to find ALL plan mappings...');

async function testDirectAPIs() {
  try {
    // Test 1: Try to get plans for a specific product directly
    const productId = 'prod_eDCd1IVJV9gxZ'; // One without plan mapping
    
    console.log(`\n🔍 Test 1: Direct product plans for ${productId}`);
    try {
      const productResponse = await fetch(`https://api.whop.com/v5/products/${productId}/plans`, {
        headers: { 'Authorization': `Bearer ${WHOP_API_KEY}` }
      });
      console.log(`📊 Status: ${productResponse.status}`);
      if (productResponse.ok) {
        const data = await productResponse.json();
        console.log('✅ Product plans:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ Error:', await productResponse.text());
      }
    } catch (e) {
      console.log('❌ Request failed:', e.message);
    }

    // Test 2: Try to get ALL company plans
    console.log('\n🔍 Test 2: All company plans');
    try {
      const plansResponse = await fetch('https://api.whop.com/v5/company/plans?per=100', {
        headers: { 'Authorization': `Bearer ${WHOP_API_KEY}` }
      });
      console.log(`📊 Status: ${plansResponse.status}`);
      if (plansResponse.ok) {
        const data = await plansResponse.json();
        console.log('✅ All company plans:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ Error:', await plansResponse.text());
      }
    } catch (e) {
      console.log('❌ Request failed:', e.message);
    }

    // Test 3: Try v2 API for plans
    console.log('\n🔍 Test 3: V2 company plans');
    try {
      const v2PlansResponse = await fetch('https://api.whop.com/api/v2/me/plans?per=100', {
        headers: { 'Authorization': `Bearer ${WHOP_API_KEY}` }
      });
      console.log(`📊 Status: ${v2PlansResponse.status}`);
      if (v2PlansResponse.ok) {
        const data = await v2PlansResponse.json();
        console.log('✅ V2 plans:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ Error:', await v2PlansResponse.text());
      }
    } catch (e) {
      console.log('❌ Request failed:', e.message);
    }

  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

testDirectAPIs();
