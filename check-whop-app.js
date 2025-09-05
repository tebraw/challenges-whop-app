#!/usr/bin/env node

/**
 * WHOP APP STATUS CHECKER
 * Prüft die aktuellen Whop App Einstellungen
 */

console.log('🔍 WHOP APP STATUS CHECK\n');

// Environment Variables prüfen
console.log('📋 CURRENT ENVIRONMENT VARIABLES:');
const envVars = [
  'WHOP_API_KEY',
  'NEXT_PUBLIC_WHOP_APP_ID', 
  'NEXT_PUBLIC_WHOP_COMPANY_ID',
  'WHOP_OAUTH_CLIENT_ID',
  'WHOP_OAUTH_CLIENT_SECRET'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const masked = value.length > 10 ? 
      value.slice(0, 6) + '...' + value.slice(-4) : 
      value;
    console.log(`   ✅ ${varName}=${masked}`);
  } else {
    console.log(`   ❌ ${varName}=undefined`);
  }
});

console.log('\n🔗 POSSIBLE ISSUES:');
console.log('1. ❌ Experience URL 404 → App not installed in company');
console.log('2. 🔧 Wrong Company ID → Check dev.whop.com for actual ID');
console.log('3. 📱 App not configured as Experience → Check app type');
console.log('4. 🚫 App not published → Check app status');

console.log('\n🚀 ALTERNATIVE SOLUTIONS:');
console.log('1. 🔐 OAuth Login: Try direct app URL with "Try Whop Login"');
console.log('2. 🏢 Create new Company: Install app in fresh company');
console.log('3. 📞 Check Developer Portal: Verify app installation');

console.log('\n📱 DIRECT URLS TO TRY:');
console.log('• Developer Portal: https://dev.whop.com/apps/app_zPVd4wYq8wpnEr');
console.log('• Direct App (OAuth): https://challenges-whop-app-sqmr.vercel.app/whop-debug');
console.log('• Whop Dashboard: https://whop.com/dashboard');

console.log('\n🎯 NEXT STEPS:');
console.log('1. Check Developer Portal links above');
console.log('2. If app exists → Find correct Company ID');
console.log('3. If app missing → Install in company');
console.log('4. If all fails → Use OAuth login as fallback');

console.log('\n💡 TIP: OAuth login should work even if Experience URL fails!');
