/**
 * 🔧 TECHNISCHER DATENFLUSS - Für Entwickler
 * 
 * Detaillierte Erklärung der technischen Abläufe und API-Aufrufe
 */

console.log('🔧 TECHNISCHER DATENFLUSS & API-INTEGRATION');
console.log('============================================');

console.log('\n🔌 WHOP API INTEGRATION:');
console.log('┌─────────────────────────────────────────┐');
console.log('│ 1. AUTHENTICATION                      │');
console.log('└─────────────────────────────────────────┘');
console.log('Headers von Whop:');
console.log('• x-experience-id: exp_9igIIxfCLFakDh');
console.log('• x-whop-user-token: eyJ0eXAiOiJKV1Q...');
console.log('• x-company-id: (manchmal vorhanden)');
console.log('');
console.log('App-Verarbeitung:');
console.log('1. middleware.ts → Prüft Headers');
console.log('2. lib/auth.ts → getCurrentUser()');
console.log('3. Whop SDK → getUserDetails()');

console.log('\n🏗️ USER CREATION FLOW:');
console.log('┌─────────────────────────────────────────┐');
console.log('│ 2. AUTOMATIC USER SETUP                │');
console.log('└─────────────────────────────────────────┘');
console.log('Code Flow:');
console.log('1. extractCompanyIdFromExperience()');
console.log('   exp_9igIIxfCLFakDh → biz_9igIIxfCLFakDh');
console.log('');
console.log('2. findOrCreateTenant()');
console.log('   • Sucht Tenant mit whopCompanyId');
console.log('   • Erstellt neuen wenn nicht vorhanden');
console.log('');
console.log('3. findOrCreateUser()');
console.log('   • Verknüpft User mit Tenant');
console.log('   • Speichert Whop-Daten');

console.log('\n👑 ROLE DETERMINATION:');
console.log('┌─────────────────────────────────────────┐');
console.log('│ 3. ADMIN VS USER LOGIC                 │');
console.log('└─────────────────────────────────────────┘');
console.log('Prüfung in isCompanyOwner():');
console.log('1. whopSdk.getCompanyMembers(companyId)');
console.log('2. Filtert nach role: "owner"');
console.log('3. Vergleicht mit aktueller User ID');
console.log('4. Owner → ADMIN Role, sonst USER Role');

console.log('\n📊 WHOP DATA SYNC:');
console.log('┌─────────────────────────────────────────┐');
console.log('│ 4. INFORMATION GATHERING                │');
console.log('└─────────────────────────────────────────┘');

console.log('API Calls:');
console.log('• whopSdk.getUser() → Persönliche Daten');
console.log('• whopSdk.getCompany() → Firmen-Info');
console.log('• whopSdk.getSubscriptions() → Abo-Status');
console.log('• whopSdk.getProducts() → Verfügbare Produkte');
console.log('');
console.log('Gespeicherte Daten:');
console.log('• User.whopUserId');
console.log('• User.whopCompanyId');
console.log('• User.experienceId');
console.log('• User.subscriptionStatus');

console.log('\n🔒 MULTI-TENANT ISOLATION:');
console.log('┌─────────────────────────────────────────┐');
console.log('│ 5. DATA SEPARATION                     │');
console.log('└─────────────────────────────────────────┘');
console.log('Database Queries mit Tenant-Filter:');
console.log('');
console.log('// Challenges nur für eigene Firma');
console.log('prisma.challenge.findMany({');
console.log('  where: { tenantId: user.tenantId }');
console.log('})');
console.log('');
console.log('// Users nur aus eigener Firma');
console.log('prisma.user.findMany({');
console.log('  where: { whopCompanyId: userCompanyId }');
console.log('})');

console.log('\n🎯 REQUEST LIFECYCLE:');
console.log('┌─────────────────────────────────────────┐');
console.log('│ 6. JEDER API REQUEST                   │');
console.log('└─────────────────────────────────────────┘');
console.log('1. middleware.ts → Prüft Auth Headers');
console.log('2. getCurrentUser() → Lädt User aus DB');
console.log('3. Tenant-Check → Bestimmt Datenbereich');
console.log('4. Role-Check → Prüft Berechtigungen');
console.log('5. Query mit Tenant-Filter');
console.log('6. Response nur mit eigenen Daten');

console.log('\n🚀 PERFORMANCE OPTIMIERUNG:');
console.log('┌─────────────────────────────────────────┐');
console.log('│ 7. DATABASE INDEXES                    │');
console.log('└─────────────────────────────────────────┘');
console.log('Neue Indizes für schnelle Queries:');
console.log('• @@index([tenantId]) → Tenant-Trennung');
console.log('• @@index([whopCompanyId]) → Company-Filter');
console.log('• @@index([experienceId]) → Experience-Lookup');

console.log('\n📝 CODE BEISPIELE:');
console.log('┌─────────────────────────────────────────┐');
console.log('│ 8. WICHTIGE FUNKTIONEN                 │');
console.log('└─────────────────────────────────────────┘');

console.log('// Company ID Extraktion');
console.log('function extractCompanyIdFromExperience(experienceId) {');
console.log('  return `biz_${experienceId.replace("exp_", "")}`;');
console.log('}');
console.log('');

console.log('// Admin-Check');
console.log('async function isAdmin(userId, companyId) {');
console.log('  const members = await whopSdk.getCompanyMembers(companyId);');
console.log('  const owner = members.find(m => m.role === "owner");');
console.log('  return owner?.user_id === userId;');
console.log('}');
console.log('');

console.log('// Tenant-sichere Query');
console.log('async function getUserChallenges(userId) {');
console.log('  const user = await getCurrentUser();');
console.log('  return prisma.challenge.findMany({');
console.log('    where: { tenantId: user.tenantId }');
console.log('  });');
console.log('}');

console.log('\n✅ SICHERHEITSGARANTIEN:');
console.log('• Jeder Request wird authentifiziert');
console.log('• Tenant-Isolation auf DB-Ebene');
console.log('• Role-basierte Zugriffskontrolle');
console.log('• Keine Cross-Tenant Daten-Lecks möglich');

console.log('\n🎉 SYSTEM BEREIT FÜR PRODUCTION!');