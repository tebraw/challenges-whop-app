// Test: Find plan patterns and maybe generate plan IDs
const WHOP_API_KEY = process.env.WHOP_API_KEY;

console.log('🔍 Analyzing plan ID patterns from payments...');

async function analyzePatterns() {
  try {
    // Get all payments to analyze plan ID patterns
    const paymentsResponse = await fetch('https://api.whop.com/v5/company/payments?per=100', {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      console.log('💳 Found payments:', paymentsData.data?.length || 0);
      
      // Analyze the pattern
      for (const payment of paymentsData.data || []) {
        console.log(`\n📋 Payment Analysis:`);
        console.log(`  Product ID: ${payment.product_id}`);
        console.log(`  Plan ID: ${payment.plan_id}`);
        console.log(`  Billing: ${payment.billing_reason}`);
        console.log(`  Status: ${payment.status}`);
        console.log(`  Created: ${new Date(payment.created_at * 1000).toISOString()}`);
      }

      // Now test if we can create a promo code with JUST payment plan IDs
      const existingPlanIds = [...new Set(paymentsData.data.map(p => p.plan_id))];
      console.log('\n🎯 Existing plan IDs for testing:', existingPlanIds);

      if (existingPlanIds.length > 0) {
        console.log('\n🧪 Testing promo code creation with known plan ID...');
        
        const promoCodeData = {
          code: `TEST_${Date.now()}`,
          plan_ids: [existingPlanIds[0]], // Use the first known plan ID
          percent_off: 20,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          max_uses: 10
        };

        console.log('🚀 Attempting to create promo code:', promoCodeData);

        const promoResponse = await fetch('https://api.whop.com/api/v2/promo_codes', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHOP_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(promoCodeData)
        });

        console.log(`📊 Promo creation status: ${promoResponse.status}`);
        if (promoResponse.ok) {
          const result = await promoResponse.json();
          console.log('✅ SUCCESS! Promo code created:', result);
        } else {
          const error = await promoResponse.text();
          console.log('❌ ERROR:', error);
        }
      }

    } else {
      console.log('❌ Could not fetch payments');
    }

  } catch (error) {
    console.error('🚨 Analysis failed:', error);
  }
}

analyzePatterns();
