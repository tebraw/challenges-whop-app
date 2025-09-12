// Hole echte Company IDs über Whop API
async function getWhopCompanyForExperience(experienceId) {
  const whopClientId = process.env.WHOP_CLIENT_ID;
  const whopClientSecret = process.env.WHOP_CLIENT_SECRET;
  
  if (!whopClientId || !whopClientSecret) {
    console.log("❌ Keine Whop Credentials gefunden!");
    return null;
  }
  
  try {
    console.log(`🔍 Hole Company für Experience: ${experienceId}`);
    
    // Whop API Call für Experience Details
    const response = await fetch(`https://api.whop.com/api/v5/experiences/${experienceId}`, {
      headers: {
        'Authorization': `Bearer ${whopClientSecret}`, // Client Secret als Bearer Token
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`Error Details: ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Experience Data:`, JSON.stringify(data, null, 2));
    
    // Versuche Company ID zu extrahieren
    const companyId = data.company_id || data.company?.id || data.owner?.id;
    console.log(`🏢 Company ID: ${companyId}`);
    
    return companyId;
    
  } catch (error) {
    console.log(`❌ Error getting company for experience ${experienceId}:`, error.message);
    return null;
  }
}

async function analyzeRealCompanies() {
  console.log("🚀 Starte Whop API Analyse...\n");
  
  const experiences = [
    'exp_Tj1OwPyPNw7p0S',  // User 1
    'exp_3wSpfXnrRl7puA'   // User 2
  ];
  
  for (const expId of experiences) {
    const companyId = await getWhopCompanyForExperience(expId);
    console.log(`\n📊 Experience ${expId} → Company ${companyId || 'nicht gefunden'}\n`);
  }
  
  // Zusätzlich: Versuche OAuth zu simulieren
  console.log("\n🔐 Teste OAuth Flow...");
  
  const authUrl = `https://whop.com/oauth?client_id=${process.env.WHOP_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://challenges-whop-app-t3n8.vercel.app/api/auth/callback')}&response_type=code&scope=user:read`;
  
  console.log(`OAuth URL: ${authUrl}`);
  console.log("Mit diesem Link könntest du echte User Tokens holen!");
}

// ENV Variablen laden
require('dotenv').config({ path: '.env.local' });

analyzeRealCompanies().catch(console.error);