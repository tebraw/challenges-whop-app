console.log('🔍 CHECKING ENVIRONMENT VARIABLES AND FALLBACK VALUES\n');

console.log('='.repeat(60));
console.log('🔧 ENVIRONMENT VARIABLES:\n');

// Check all relevant environment variables
const envVars = {
  'NODE_ENV': process.env.NODE_ENV,
  'WHOP_API_KEY': process.env.WHOP_API_KEY ? 'SET' : 'NOT SET',
  'NEXT_PUBLIC_WHOP_APP_ID': process.env.NEXT_PUBLIC_WHOP_APP_ID,
  'NEXT_PUBLIC_WHOP_COMPANY_ID': process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
  'WHOP_OAUTH_CLIENT_ID': process.env.WHOP_OAUTH_CLIENT_ID ? 'SET' : 'NOT SET',
  'WHOP_OAUTH_CLIENT_SECRET': process.env.WHOP_OAUTH_CLIENT_SECRET ? 'SET' : 'NOT SET'
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}: ${value || 'NOT SET'}`);
});

console.log('\n' + '='.repeat(60));
console.log('🤔 ANALYSE DER COMPANY ID:\n');

console.log('📋 AKTUELLE SITUATION:');
console.log('• Beide User haben Company ID: 9nmw5yleoqldrxf7n48c');
console.log('• Ihr habt unterschiedliche PCs');
console.log('• Ihr habt unterschiedliche Whop Accounts');
console.log('• Ihr habt unterschiedliche Companies');
console.log('• Aber dieselbe Company ID in der DB?');
console.log('');

console.log('🔍 MÖGLICHE URSACHEN:');
console.log('');
console.log('1️⃣ FALLBACK/DEFAULT WERT:');
console.log('   • 9nmw5yleoqldrxf7n48c könnte ein Fallback-Wert sein');
console.log('   • Wird verwendet wenn echte Company ID nicht erkannt wird');
console.log('   • Aus Environment Variable oder SDK-Fallback');
console.log('');

console.log('2️⃣ DEVELOPMENT MODE:');
console.log('   • App läuft in Development Mode');
console.log('   • Verwendet Mock/Test Company ID');
console.log('   • Echte Whop Headers werden nicht übertragen');
console.log('');

console.log('3️⃣ HEADER PROBLEM:');
console.log('   • x-whop-company-id Header nicht korrekt übertragen');
console.log('   • Fallback-Logik greift');
console.log('   • System kann echte Company IDs nicht unterscheiden');
console.log('');

console.log('='.repeat(60));
console.log('🛠️ DEBUGGING SCHRITTE:\n');

console.log('1. Environment Variables prüfen');
console.log('2. Whop SDK Konfiguration checken');
console.log('3. Header-Übertragung testen');
console.log('4. Echte vs Mock Company IDs identifizieren');
console.log('');

console.log('💡 VERMUTUNG: 9nmw5yleoqldrxf7n48c ist ein FALLBACK!');
console.log('   → Echte Company IDs werden nicht korrekt übertragen');
console.log('   → System verwendet Default-Wert für alle User');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('\n' + '='.repeat(60));
console.log('📄 .ENV.LOCAL CHECK:\n');

try {
  const fs = require('fs');
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  
  console.log('Relevant lines from .env.local:');
  lines.forEach(line => {
    if (line.includes('WHOP') || line.includes('COMPANY')) {
      console.log(`   ${line}`);
    }
  });
} catch (error) {
  console.log('❌ Could not read .env.local file');
}