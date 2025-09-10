// debug-access-issue.js - Debug warum Access Denied angezeigt wird
console.log('🔍 Debugging Access Denied Issue...\n');

async function debugAccessIssue() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('1. 🔍 Checking current user authentication...');
    const accessResponse = await fetch(`${baseURL}/api/auth/access-level`);
    const accessData = await accessResponse.json();
    console.log('Access Level:', JSON.stringify(accessData, null, 2));
    
    console.log('\n2. 🔍 Checking onboarding status...');
    const onboardingResponse = await fetch(`${baseURL}/api/auth/onboarding-status`);
    
    if (onboardingResponse.ok) {
      const onboardingData = await onboardingResponse.json();
      console.log('Onboarding Status:', JSON.stringify(onboardingData, null, 2));
      
      if (!onboardingData.isCompanyOwner) {
        console.log('\n❌ PROBLEM FOUND: User is not recognized as Company Owner');
        console.log('Possible causes:');
        console.log('- No active Whop session');
        console.log('- Wrong company ID configuration');
        console.log('- User has no companies in Whop');
        console.log('- Whop API authentication issue');
      } else {
        console.log('\n✅ User IS a Company Owner - checking subscription...');
        
        if (!onboardingData.hasActiveSubscription) {
          console.log('❌ PROBLEM: No active subscription - should show onboarding page');
        } else {
          console.log('✅ Has active subscription - should have admin access');
        }
      }
    } else {
      console.log('❌ Onboarding status check failed:', onboardingResponse.status);
    }
    
    console.log('\n3. 🔍 Checking direct auth endpoint...');
    const authResponse = await fetch(`${baseURL}/api/auth/me`);
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Auth Me:', JSON.stringify(authData, null, 2));
    } else {
      console.log('❌ Auth me failed:', authResponse.status);
    }
    
    console.log('\n🛠️ QUICK FIX OPTIONS:');
    console.log('1. Go to: http://localhost:3000/dev-login (bypass authentication)');
    console.log('2. Create emergency admin user');
    console.log('3. Check Whop company configuration');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAccessIssue();
