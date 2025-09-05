#!/usr/bin/env node

/**
 * WHOP EXPERIENCE APP SETUP GUIDE
 * Korrekte Konfiguration für Company Owner Challenge Creation
 */

console.log('🏗️ WHOP EXPERIENCE APP SETUP GUIDE\n');

console.log('🎯 ZIEL: Company Owner installiert App → Challenge Creation via iFrame\n');

console.log('📋 CHECKLIST FÜR KORREKTE KONFIGURATION:\n');

console.log('1. ✅ APP ALS EXPERIENCE ERSTELLEN/KONFIGURIEREN:');
console.log('   → Gehe zu: https://dev.whop.com');
console.log('   → "Create App" oder bestehende App bearbeiten');
console.log('   → App Type: "Experience App" ✅');
console.log('   → App Name: "Challenge Creator"');
console.log('   → Description: "Create challenges for your community"\n');

console.log('2. ✅ EXPERIENCE URLS KONFIGURIEREN:');
console.log('   → iFrame URL: https://challenges-whop-app-sqmr.vercel.app');
console.log('   → Permissions: user:read, memberships:read');
console.log('   → Scopes: company:read (für Company Owner Detection)\n');

console.log('3. ✅ WEBHOOKS SETUP (optional):');
console.log('   → Webhook URL: https://challenges-whop-app-sqmr.vercel.app/api/whop/webhook');
console.log('   → Events: app.installed, membership.created\n');

console.log('4. ✅ APP PUBLISH/SUBMIT:');
console.log('   → Development → Review → Publish');
console.log('   → Status: "Live" oder "Published" ✅\n');

console.log('5. ✅ COMPANY INSTALLATION:');
console.log('   → Als Company Owner: App in Company installieren');
console.log('   → Permissions bestätigen');
console.log('   → Installation erfolgreich ✅\n');

console.log('📱 NACH SETUP - RICHTIGE URLS:\n');

console.log('Developer Portal: https://dev.whop.com/apps/[ECHTE_APP_ID]');
console.log('Company Dashboard: https://whop.com/company/[ECHTE_COMPANY_ID]');
console.log('Experience URL: https://whop.com/company/[ECHTE_COMPANY_ID]/experiences/[ECHTE_APP_ID]');
console.log('Alternative URL: https://whop.com/hub/[ECHTE_COMPANY_ID]/apps/[ECHTE_APP_ID]\n');

console.log('🧪 TESTING WORKFLOW:\n');
console.log('1. Company Owner öffnet Experience URL');
console.log('2. App lädt in iFrame mit Whop Headers');
console.log('3. Auto-Login als Admin (Company Owner)');
console.log('4. Zugang zu /admin für Challenge Creation');
console.log('5. Multi-Tenant: Jede Company = eigener Tenant\n');

console.log('🚨 DEBUGGING BEI 404:\n');
console.log('→ Falsche IDs in URL');
console.log('→ App nicht installiert in Company');
console.log('→ App nicht als Experience konfiguriert');
console.log('→ App noch nicht published\n');

console.log('💡 NEXT STEP: Gehe zu dev.whop.com und finde deine ECHTE App ID!');
