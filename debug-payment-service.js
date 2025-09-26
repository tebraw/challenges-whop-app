const { whopSdk } = require('./lib/whop-sdk-dual');

async function debugPaymentService() {
  console.log('=== DEBUGGING WHOP PAYMENT SERVICE ===');
  
  try {
    console.log('');
    console.log('1. Testing Whop SDK availability...');
    console.log('whopSdk available:', !!whopSdk);
    console.log('whopSdk.payments available:', !!whopSdk?.payments);
    console.log('whopSdk.payments.chargeUser available:', !!whopSdk?.payments?.chargeUser);
    
    console.log('');
    console.log('2. Testing chargeUser method...');
    
    // Test the payment method with minimal data
    const testPayment = await whopSdk.payments.chargeUser({
      userId: 'user_test123', // Test user ID
      amount: 500, // 5 USD in cents
      currency: 'usd',
      metadata: {
        type: 'challenge_entry',
        challengeId: 'test_challenge',
        testing: 'true'
      }
    });
    
    console.log('');
    console.log('3. Payment Result Analysis:');
    console.log('Full result:', JSON.stringify(testPayment, null, 2));
    console.log('');
    console.log('Result properties:');
    console.log('- checkoutUrl:', testPayment?.checkoutUrl);
    console.log('- inAppPurchase.checkoutUrl:', testPayment?.inAppPurchase?.checkoutUrl);
    console.log('- id:', testPayment?.id);
    console.log('- inAppPurchase.id:', testPayment?.inAppPurchase?.id);
    console.log('- status:', testPayment?.status);
    
    console.log('');
    console.log('4. Expected format check:');
    const checkoutUrl = testPayment?.checkoutUrl || testPayment?.inAppPurchase?.checkoutUrl;
    const checkoutSessionId = testPayment?.id || testPayment?.inAppPurchase?.id;
    
    console.log('Extracted checkoutUrl:', checkoutUrl);
    console.log('Extracted checkoutSessionId:', checkoutSessionId);
    console.log('Success condition:', !!(checkoutUrl && checkoutSessionId));
    
  } catch (error) {
    console.error('');
    console.error('❌ PAYMENT SERVICE ERROR:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    if (error.message.includes('API Key')) {
      console.error('');
      console.error('🔑 WHOP API KEY ISSUE DETECTED!');
      console.error('- Check if WHOP_APP_API_KEY is set in environment variables');
      console.error('- Verify API Key has payment permissions');
      console.error('- Ensure SDK is configured correctly');
    }
  }
}

debugPaymentService().catch(console.error);