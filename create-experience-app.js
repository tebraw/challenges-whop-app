#!/usr/bin/env node

/**
 * WHOP EXPERIENCE APP CREATION GUIDE
 * Falls App Type nicht änderbar ist, neue Experience App erstellen
 */

console.log('🆕 NEUE WHOP EXPERIENCE APP ERSTELLEN\n');

console.log('🔧 FALLS APP TYPE NICHT ÄNDERBAR IST:\n');

console.log('SCHRITT 1: Neue Experience App erstellen');
console.log('→ Gehe zu: https://dev.whop.com');
console.log('→ Klicke "Create New App"');
console.log('→ Wähle "Experience App" als Type\n');

console.log('SCHRITT 2: App Details eingeben');
console.log('→ App Name: "Challenge Creator"');
console.log('→ Description: "Create challenges for your community"');
console.log('→ Icon: Upload Logo (optional)\n');

console.log('SCHRITT 3: Experience URLs konfigurieren');
console.log('→ iFrame URL: https://challenges-whop-app-sqmr.vercel.app');
console.log('→ OAuth Redirect: https://challenges-whop-app-sqmr.vercel.app/api/auth/whop/callback');
console.log('→ Webhook URL: https://challenges-whop-app-sqmr.vercel.app/api/whop/webhook\n');

console.log('SCHRITT 4: Permissions setzen');
console.log('→ ☑️ user:read (User Info lesen)');
console.log('→ ☑️ memberships:read (Membership Status)');
console.log('→ ☑️ company:read (Company Owner Detection)\n');

console.log('SCHRITT 5: App erstellen und IDs kopieren');
console.log('→ Klicke "Create App"');
console.log('→ Neue App ID kopieren (z.B. app_NEW123XYZ)');
console.log('→ Client ID kopieren');
console.log('→ Client Secret kopieren\n');

console.log('SCHRITT 6: Environment Variables aktualisieren');
console.log('→ NEXT_PUBLIC_WHOP_APP_ID=app_NEW123XYZ');
console.log('→ WHOP_OAUTH_CLIENT_ID=neue_client_id');
console.log('→ WHOP_OAUTH_CLIENT_SECRET=neues_secret\n');

console.log('SCHRITT 7: App in Company installieren');
console.log('→ Als Company Owner: App installieren');
console.log('→ Permissions bestätigen');
console.log('→ Installation erfolgreich\n');

console.log('SCHRITT 8: Neue Experience URL testen');
console.log('→ https://whop.com/company/biz_YoIIIT73rXwrtK/experiences/app_NEW123XYZ\n');

console.log('💡 ALTERNATIVE: Experience Apps können auch "embedded" werden');
console.log('→ Im Company Dashboard als "Custom Experience" hinzufügen');
console.log('→ iFrame URL direkt einbetten\n');

console.log('🎯 RESULT: Company Owner → Experience URL → Challenge Creation iFrame!');
