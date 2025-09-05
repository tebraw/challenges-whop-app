// scripts/setup-whop-auth.js
// Quick script to help you set up Whop authentication

const http = require('http');
const fs = require('fs');
const path = require('path');

async function checkWhopStatus() {
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3000/api/auth/whop/status', {
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
}

async function main() {
  console.log('🔍 WHOP AUTHENTICATION SETUP CHECK');
  console.log('=====================================\n');

  try {
    // Check if server is running
    console.log('📡 Checking development server...');
    const status = await checkWhopStatus();
    
    console.log('✅ Server is running!\n');
    console.log('📊 Current Whop Configuration:');
    console.log(`   • Configured: ${status.configured ? '✅ Yes' : '❌ No'}`);
    console.log(`   • Client ID: ${status.hasClientId ? '✅ Set' : '❌ Missing'}`);
    console.log(`   • Client Secret: ${status.hasClientSecret ? '✅ Set' : '❌ Missing'}`);
    console.log(`   • API Key: ${status.hasApiKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   • Message: ${status.message}\n`);

    if (!status.configured) {
      console.log('⚠️  WHOP OAUTH NOT CONFIGURED');
      console.log('=====================================');
      console.log('Das System nutzt derzeit Development Mode.');
      console.log('Du siehst einen Mock Admin User anstatt deines echten Whop Accounts.\n');
      
      console.log('🚀 SO RICHTEST DU ECHTE WHOP ANMELDUNG EIN:');
      console.log('');
      console.log('1. 🌐 Gehe zu: https://dev.whop.com');
      console.log('2. 🔐 Erstelle eine neue App oder nutze bestehende');
      console.log('3. ⚙️  App Settings konfigurieren:');
      console.log('   • Redirect URI: http://localhost:3000/api/auth/whop/callback');
      console.log('   • Scopes: user:read, memberships:read');
      console.log('');
      console.log('4. 📝 Erstelle .env.local Datei mit:');
      console.log('   WHOP_OAUTH_CLIENT_ID=deine_client_id');
      console.log('   WHOP_OAUTH_CLIENT_SECRET=dein_client_secret');
      console.log('   WHOP_API_KEY=dein_api_key');
      console.log('   NEXT_PUBLIC_WHOP_COMPANY_ID=deine_company_id');
      console.log('   NEXTAUTH_URL=http://localhost:3000');
      console.log('');
      console.log('5. 🔄 Server neu starten: npm run dev');
      console.log('');
      console.log('📋 Example .env.local Template wurde erstellt!');
      
      // Create .env.local template
      const envTemplate = `# Whop OAuth Configuration für echte Anmeldung
# Trage deine echten Whop Credentials hier ein

WHOP_OAUTH_CLIENT_ID=your_client_id_here
WHOP_OAUTH_CLIENT_SECRET=your_client_secret_here
WHOP_API_KEY=your_api_key_here
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id_here
NEXTAUTH_URL=http://localhost:3000

# Hinweis: Diese Werte bekommst du von https://dev.whop.com
# Nach dem Eintragen: Server neu starten mit "npm run dev"
`;
      
      fs.writeFileSync('.env.local.template', envTemplate);
      console.log('✅ .env.local.template erstellt!');
      
    } else {
      console.log('🎉 WHOP OAUTH IST KONFIGURIERT!');
      console.log('Du kannst dich jetzt mit deinem echten Whop Account anmelden.');
      console.log('');
      console.log('🔗 Test Links:');
      console.log('   • Login: http://localhost:3000/auth/whop');
      console.log('   • Admin: http://localhost:3000/admin');
    }
    
    console.log('\n🔍 TESTING-MODUS (funktioniert immer):');
    console.log('Wenn du nur testen willst, nutze den "Dev Admin Login" Button.');
    console.log('Dieser gibt dir sofortigen Admin-Zugang ohne Whop Setup!');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Development server is not running!');
      console.log('');
      console.log('🚀 Start the server first:');
      console.log('   npm run dev');
      console.log('');
      console.log('Then run this script again.');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

main().catch(console.error);
