// debug-whop-company-api.js
// Debug warum die Whop Company API 404 zurückgibt

async function debugWhopCompanyAPI() {
  console.log('🔍 DEBUGGING: Warum können wir keine echten Company Daten lesen?\n');

  // Test verschiedene Whop API Endpoints
  const testUsers = [
    'user_eGf5vVjIuGLSy',
    'user_w3lVukX5x9ayO',
    'user_4CUq7XKZv98Zy',
    'user_HMQlzoJ8oUhV8'
  ];

  for (const userId of testUsers) {
    console.log(`👤 Testing user: ${userId}`);
    
    try {
      // Test 1: User Company API
      console.log('   🔍 Testing: /v5/users/{userId}/companies');
      const companyResponse = await fetch(`https://api.whop.com/v5/users/${userId}/companies`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   📊 Status: ${companyResponse.status} ${companyResponse.statusText}`);
      
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        console.log(`   ✅ SUCCESS: Found ${companyData.data?.length || 0} companies`);
        if (companyData.data?.length > 0) {
          console.log(`   🏢 Companies:`, companyData.data.map(c => ({ id: c.id, name: c.name })));
        }
      } else {
        console.log(`   ❌ FAILED: ${companyResponse.status} - ${companyResponse.statusText}`);
        if (companyResponse.status === 404) {
          console.log(`   💡 REASON: User hat keine Companies ODER API Endpoint nicht verfügbar`);
        }
        if (companyResponse.status === 403) {
          console.log(`   💡 REASON: Permissions Problem - API Key hat keine Berechtigung`);
        }
      }

      // Test 2: User Details API  
      console.log('   🔍 Testing: /v5/users/{userId}');
      const userResponse = await fetch(`https://api.whop.com/v5/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   📊 User API Status: ${userResponse.status}`);
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log(`   👤 User Data:`, {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          hasCompanyField: 'company' in userData,
          hasCompaniesField: 'companies' in userData
        });
      }

    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🤔 MÖGLICHE GRÜNDE warum Company API nicht funktioniert:');
  console.log('');
  console.log('1️⃣ PERMISSIONS: API Key hat keine Company-Read Berechtigung');
  console.log('2️⃣ USER TYPE: Diese User sind keine "Company Owners" in Whop');
  console.log('3️⃣ API ENDPOINT: /users/{id}/companies existiert nicht oder deprecated');
  console.log('4️⃣ WHOP SETUP: Companies sind anders strukturiert als erwartet');
  console.log('');
  console.log('💡 ALTERNATIVE LÖSUNGEN:');
  console.log('• Whop Support fragen nach korrektem Company API Endpoint');
  console.log('• Prüfen ob User Profile andere Company Daten enthält');
  console.log('• Alternative: User selbst Company Name eingeben lassen');
  console.log('• Current: Automatic unique Company per User (funktioniert perfekt!)');
}

debugWhopCompanyAPI().catch(console.error);