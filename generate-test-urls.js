#!/usr/bin/env node

/**
 * WHOP EXPERIENCE APP URL GENERATOR
 * Generates the correct URLs to test the Experience App
 */

const WHOP_APP_ID = 'app_zPVd4wYq8wpnEr';
const WHOP_COMPANY_ID = 'biz_YoIIIT73rXwrtK';
const APP_URL = 'https://challenges-whop-app-sqmr.vercel.app';

console.log('🖼️ WHOP EXPERIENCE APP TEST URLS\n');

console.log('📋 WICHTIGE INFORMATIONEN:');
console.log(`   App ID: ${WHOP_APP_ID}`);
console.log(`   Company ID: ${WHOP_COMPANY_ID}`);
console.log(`   App URL: ${APP_URL}\n`);

console.log('🔗 TEST URLS:\n');

console.log('1. 🏢 WHOP DEVELOPER PORTAL:');
console.log(`   https://dev.whop.com/apps/${WHOP_APP_ID}\n`);

console.log('2. 🖼️ EXPERIENCE APP (in Company):');
console.log(`   https://whop.com/company/${WHOP_COMPANY_ID}/experiences/${WHOP_APP_ID}\n`);

console.log('3. 🧪 DEBUG SEITE (Experience):');
console.log(`   https://whop.com/company/${WHOP_COMPANY_ID}/experiences/${WHOP_APP_ID}/whop-debug\n`);

console.log('4. 🔐 DIREKTE APP (für OAuth Test):');
console.log(`   ${APP_URL}/whop-debug\n`);

console.log('📱 TESTING STEPS:\n');
console.log('SCHRITT 1: Öffne Developer Portal Link (1)');
console.log('SCHRITT 2: Stelle sicher dass App installiert ist');
console.log('SCHRITT 3: Öffne Experience App Link (2)');
console.log('SCHRITT 4: Navigiere zu Debug Seite (/whop-debug)');
console.log('SCHRITT 5: Klicke "Test Experience Auth"\n');

console.log('✅ ERWARTETES ERGEBNIS:');
console.log('   - Experience Context: userId ✅, companyId ✅');
console.log('   - Current User: automatisch erstellt ✅');
console.log('   - Auth Method: "experience-app" ✅\n');

console.log('🚨 FALLS PROBLEME:');
console.log('   - Teste "Check Whop Headers" für verfügbare Headers');
console.log('   - Prüfe Browser Console auf Errors');
console.log('   - Teste direkte URL (4) für OAuth fallback\n');

console.log('🎯 READY TO TEST! 🚀');
