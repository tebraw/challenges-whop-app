// debug-company-owner-headers.js
// Comprehensive debug for company owner header detection

const productionURL = 'https://challenges-fresh.vercel.app';

async function debugCompanyOwnerHeaders() {
  console.log('🕵️ Starting comprehensive company owner header debug...\n');

  try {
    console.log('1. 🔍 Testing Experience Context Headers...');
    const experienceResponse = await fetch(`${productionURL}/api/debug/experience-context`);
    
    if (experienceResponse.ok) {
      const experienceData = await experienceResponse.json();
      console.log('Experience Context Data:');
      console.log(JSON.stringify(experienceData, null, 2));
      
      console.log('\n📊 Header Analysis:');
      const headers = experienceData.headers || {};
      
      // Check for all possible header variations
      const headerVariations = [
        'x-whop-user-id', 'X-Whop-User-Id', 'x-user-id', 'X-User-Id',
        'x-whop-company-id', 'X-Whop-Company-Id', 'x-company-id', 'X-Company-Id',
        'x-whop-experience-id', 'X-Whop-Experience-Id', 'x-experience-id', 'X-Experience-Id',
        'x-whop-membership-id', 'X-Whop-Membership-Id', 'x-membership-id', 'X-Membership-Id',
        'x-whop-user-token', 'X-Whop-User-Token', 'authorization', 'Authorization'
      ];
      
      headerVariations.forEach(headerName => {
        const value = headers[headerName];
        if (value) {
          console.log(`  ✅ ${headerName}: ${value.slice(0, 20)}...`);
        } else {
          console.log(`  ❌ ${headerName}: Not found`);
        }
      });
      
      console.log('\n🍪 Cookie Analysis:');
      const cookies = experienceData.cookies || {};
      Object.keys(cookies).forEach(cookieName => {
        console.log(`  🍪 ${cookieName}: ${cookies[cookieName].slice(0, 20)}...`);
      });
      
      console.log('\n🧪 Context Analysis:');
      const context = experienceData.experienceContext || {};
      console.log(`  👤 User ID: ${context.userId || 'Not found'}`);
      console.log(`  🏢 Company ID: ${context.companyId || 'Not found'}`);
      console.log(`  🎭 Experience ID: ${context.experienceId || 'Not found'}`);
      console.log(`  🖼️ Is Embedded: ${context.isEmbedded || false}`);
      
      console.log('\n🔐 Current User Status:');
      const currentUser = experienceData.currentUser;
      if (currentUser) {
        console.log(`  ✅ User found: ${currentUser.email}`);
        console.log(`  👑 Role: ${currentUser.role}`);
        console.log(`  🆔 Whop User ID: ${currentUser.whopUserId || 'Not set'}`);
        console.log(`  🏢 Whop Company ID: ${currentUser.whopCompanyId || 'Not set'}`);
      } else {
        console.log('  ❌ No user found');
      }
      
    } else {
      console.log('❌ Experience context check failed:', experienceResponse.status);
    }

    console.log('\n2. 🔍 Testing Whop Headers Endpoint...');
    const headersResponse = await fetch(`${productionURL}/api/debug/whop-headers`);
    
    if (headersResponse.ok) {
      const headersData = await headersResponse.json();
      console.log('Whop Headers Data:');
      console.log(JSON.stringify(headersData, null, 2));
    } else {
      console.log('❌ Whop headers check failed:', headersResponse.status);
    }

    console.log('\n3. 🔍 Testing Auth Status...');
    const authResponse = await fetch(`${productionURL}/api/auth/whop/status`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Auth Status Data:');
      console.log(JSON.stringify(authData, null, 2));
    } else {
      console.log('❌ Auth status check failed:', authResponse.status);
    }

    console.log('\n4. 🔍 Testing Access Level...');
    const accessResponse = await fetch(`${productionURL}/api/auth/access-level`);
    
    if (accessResponse.ok) {
      const accessData = await accessResponse.json();
      console.log('Access Level Data:');
      console.log(JSON.stringify(accessData, null, 2));
    } else {
      console.log('❌ Access level check failed:', accessResponse.status);
      console.log('Response text:', await accessResponse.text());
    }

    console.log('\n5. 🔍 Testing Onboarding Status...');
    const onboardingResponse = await fetch(`${productionURL}/api/auth/onboarding-status`);
    
    if (onboardingResponse.ok) {
      const onboardingData = await onboardingResponse.json();
      console.log('Onboarding Status Data:');
      console.log(JSON.stringify(onboardingData, null, 2));
    } else {
      console.log('❌ Onboarding status check failed:', onboardingResponse.status);
      console.log('Response text:', await onboardingResponse.text());
    }

    console.log('\n6. 📋 Summary and Recommendations:');
    
    if (experienceResponse.ok) {
      const data = await fetch(`${productionURL}/api/debug/experience-context`).then(r => r.json());
      const hasUserId = data.experienceContext?.userId;
      const hasCompanyId = data.experienceContext?.companyId;
      const isEmbedded = data.experienceContext?.isEmbedded;
      const currentUser = data.currentUser;
      
      console.log('\n📊 Diagnostic Results:');
      console.log(`  🔍 Headers detected: ${hasUserId ? '✅' : '❌'} User ID, ${hasCompanyId ? '✅' : '❌'} Company ID`);
      console.log(`  🖼️ Embedded context: ${isEmbedded ? '✅' : '❌'} Is in Whop iframe`);
      console.log(`  👤 User authenticated: ${currentUser ? '✅' : '❌'} Current user exists`);
      console.log(`  👑 Admin role: ${currentUser?.role === 'ADMIN' ? '✅' : '❌'} Has admin role`);
      
      if (!hasUserId || !hasCompanyId) {
        console.log('\n🚨 PROBLEM IDENTIFIED:');
        console.log('  Missing essential headers from Whop iframe');
        console.log('  This suggests the app is not properly embedded or headers are not being passed');
        
        console.log('\n💡 SOLUTIONS TO TRY:');
        console.log('  1. Verify Whop app configuration includes proper header passing');
        console.log('  2. Check if accessing via direct experience URL vs dashboard');
        console.log('  3. Ensure app is accessed through Whop ecosystem, not direct URL');
        console.log('  4. Check Whop app permissions and experience setup');
      }
      
      if (hasUserId && hasCompanyId && !currentUser) {
        console.log('\n🚨 PROBLEM IDENTIFIED:');
        console.log('  Headers present but user creation/authentication failing');
        
        console.log('\n💡 SOLUTIONS TO TRY:');
        console.log('  1. Check database connectivity and user creation logic');
        console.log('  2. Verify Whop API key and permissions');
        console.log('  3. Check tenant creation and association logic');
      }
      
      if (currentUser && currentUser.role !== 'ADMIN') {
        console.log('\n🚨 PROBLEM IDENTIFIED:');
        console.log('  User exists but not getting admin role');
        
        console.log('\n💡 SOLUTIONS TO TRY:');
        console.log('  1. Check company ownership detection in getWhopExperienceRole');
        console.log('  2. Verify Whop API v5 company ownership endpoint');
        console.log('  3. Check user ID matching between headers and API calls');
      }
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

debugCompanyOwnerHeaders();
