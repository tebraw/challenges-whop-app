// Debug Whop API Connection
require('dotenv').config({ path: '.env.local' });

async function testWhopConnection() {
  console.log("🔍 Debugge Whop API Verbindung...\n");
  
  // Check Environment Variables
  console.log("📋 Environment Variables:");
  console.log(`WHOP_CLIENT_ID: ${process.env.WHOP_CLIENT_ID || 'FEHLT'}`);
  console.log(`WHOP_CLIENT_SECRET: ${process.env.WHOP_CLIENT_SECRET ? 'GESETZT' : 'FEHLT'}`);
  console.log(`WHOP_API_KEY: ${process.env.WHOP_API_KEY || 'FEHLT'}`);
  console.log(`WHOP_APP_ID: ${process.env.WHOP_APP_ID || 'FEHLT'}\n`);
  
  // Test verschiedene API Endpoints
  const endpoints = [
    {
      name: "Whop Me (mit API Key)",
      url: "https://api.whop.com/api/v1/me",
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: "Whop Me (mit Client Secret)",
      url: "https://api.whop.com/api/v1/me", 
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_CLIENT_SECRET}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: "Whop App Info",
      url: `https://api.whop.com/api/v1/apps/${process.env.WHOP_APP_ID}`,
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: "Whop Companies (v5)",
      url: "https://api.whop.com/api/v5/companies",
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`🔗 Teste: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: endpoint.headers
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS:`, JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log(`❌ ERROR: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`❌ FETCH ERROR: ${error.message}`);
    }
    
    console.log('---\n');
  }
}

// Test auch OAuth Flow
async function testOAuthFlow() {
  console.log("🔐 OAuth Flow Test...\n");
  
  const clientId = process.env.WHOP_CLIENT_ID;
  const redirectUri = process.env.WHOP_OAUTH_REDIRECT_URI || 'https://challenges-whop-app-sqmr.vercel.app/api/auth/whop/callback';
  
  const authUrl = `https://whop.com/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user:read companies:read`;
  
  console.log("OAuth URL:");
  console.log(authUrl);
  console.log("\n💡 Mit diesem Link könntest du einen echten OAuth Token holen!");
}

// Test App Installation
async function testAppInstallation() {
  console.log("🏗️ App Installation Test...\n");
  
  try {
    // Test ob unsere App installiert ist
    const response = await fetch(`https://api.whop.com/api/v1/apps/${process.env.WHOP_APP_ID}/installations`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`App Installations Status: ${response.status}`);
    
    if (response.ok) {
      const installations = await response.json();
      console.log("✅ App Installations:", JSON.stringify(installations, null, 2));
    } else {
      const error = await response.text();
      console.log("❌ App Installation Error:", error);
    }
    
  } catch (error) {
    console.log("❌ Installation Check Error:", error.message);
  }
}

// Versuche User über SDK zu finden
async function testWhopSDK() {
  console.log("🔧 Teste Whop SDK Installation...\n");
  
  try {
    const whop = require('@whop-apps/sdk');
    console.log("✅ Whop SDK gefunden!");
    console.log("Verfügbare Funktionen:", Object.keys(whop));
  } catch (error) {
    console.log("❌ Whop SDK nicht installiert:", error.message);
    console.log("💡 Installiere mit: npm install @whop-apps/sdk");
  }
}

console.log("🚀 Starte Whop Connection Debug...\n");

testWhopConnection()
  .then(() => testOAuthFlow())
  .then(() => testAppInstallation()) 
  .then(() => testWhopSDK())
  .then(() => console.log("\n✅ Debug Complete!"))
  .catch(console.error);