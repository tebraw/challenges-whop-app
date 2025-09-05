#!/usr/bin/env node

/**
 * WHOP IFRAME EXPERIENCE DEBUG
 * Systematisches Debugging warum iFrame Experience nicht funktioniert
 */

console.log('🖼️ WHOP IFRAME EXPERIENCE DEBUG\n');

console.log('❓ PROBLEM: Experience URL zeigt 404');
console.log('🎯 ZIEL: Company Owner installiert App → kann Challenges erstellen\n');

console.log('🔍 MÖGLICHE URSACHEN:\n');

console.log('1. 📱 APP NICHT ALS EXPERIENCE KONFIGURIERT:');
console.log('   → App ist als "Standard App" statt "Experience App" eingerichtet');
console.log('   → Lösung: In dev.whop.com App Type auf "Experience" ändern\n');

console.log('2. 🏢 APP NICHT IN COMPANY INSTALLIERT:');
console.log('   → App existiert aber ist nicht in der Company installiert');
console.log('   → Company Owner muss App explizit installieren\n');

console.log('3. 🔧 FALSCHE APP/COMPANY IDs:');
console.log('   → IDs in URL stimmen nicht mit realen IDs überein');
console.log('   → Alte/Test IDs statt echte Production IDs\n');

console.log('4. 🚫 APP NICHT PUBLISHED/APPROVED:');
console.log('   → App ist noch im Draft/Development Status');
console.log('   → Muss published/approved sein für Experience URLs\n');

console.log('🎯 DEBUGGING SCHRITTE:\n');

console.log('SCHRITT 1: Developer Portal prüfen');
console.log('→ https://dev.whop.com');
console.log('→ Alle deine Apps auflisten');
console.log('→ Richtige App ID finden');
console.log('→ App Type = "Experience" prüfen\n');

console.log('SCHRITT 2: Company Dashboard prüfen');
console.log('→ https://whop.com/dashboard');
console.log('→ Deine Companies auflisten');
console.log('→ In Company: Installierte Apps prüfen');
console.log('→ Challenge App installiert? ✅\n');

console.log('SCHRITT 3: URLs korrigieren');
console.log('→ Echte App ID aus Developer Portal');
console.log('→ Echte Company ID aus Dashboard');
console.log('→ Neue Experience URL bilden\n');

console.log('SCHRITT 4: Experience URL Format');
console.log('KORREKT: https://whop.com/hub/[COMPANY_ID]/apps/[APP_ID]');
console.log('ODER:    https://whop.com/company/[COMPANY_ID]/experiences/[APP_ID]');
console.log('FALSCH:  https://whop.com/company/[WRONG_ID]/experiences/[WRONG_ID]\n');

console.log('💡 SOFORTIGE TESTS:');
console.log('1. Gehe zu https://dev.whop.com und finde deine echte App');
console.log('2. Gehe zu https://whop.com/dashboard und finde deine echte Company');
console.log('3. Installiere App in Company falls nicht vorhanden');
console.log('4. Baue korrekte Experience URL mit echten IDs\n');

console.log('🚨 CRITICAL: Ohne korrekte Installation + IDs wird Experience URL immer 404 sein!');
