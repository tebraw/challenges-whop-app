// scripts/fix-admin-security.js
const fs = require('fs');
const path = require('path');

const adminApiDirs = [
  'app/api/admin/challenge-offers',
  'app/api/admin/marketing-insights',
  'app/api/admin/product-opportunities',
  'app/api/admin/segments'
];

function fixAdminAPI(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Datei nicht gefunden: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if requireAdmin is already imported
  if (content.includes('requireAdmin')) {
    console.log(`✅ ${filePath} - bereits gesichert`);
    return;
  }
  
  // Add import
  if (!content.includes("import { requireAdmin }")) {
    content = content.replace(
      /import { NextResponse } from ['"]next\/server['"];?\n/,
      `import { NextResponse } from 'next/server';\nimport { requireAdmin } from '@/lib/auth';\n`
    );
  }
  
  // Add requireAdmin() call after try {
  content = content.replace(
    /export async function GET\([^)]*\) \{\s*try \{/g,
    match => match + '\n    // SICHERHEIT: Nur Admins\n    await requireAdmin();\n'
  );
  
  content = content.replace(
    /export async function POST\([^)]*\) \{\s*try \{/g,
    match => match + '\n    // SICHERHEIT: Nur Admins\n    await requireAdmin();\n'
  );
  
  content = content.replace(
    /export async function PUT\([^)]*\) \{\s*try \{/g,
    match => match + '\n    // SICHERHEIT: Nur Admins\n    await requireAdmin();\n'
  );
  
  content = content.replace(
    /export async function DELETE\([^)]*\) \{\s*try \{/g,
    match => match + '\n    // SICHERHEIT: Nur Admins\n    await requireAdmin();\n'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`🔒 ${filePath} - gesichert`);
}

// Fix all admin API files
const adminFiles = [
  'app/api/admin/challenge-offers/route.ts',
  'app/api/admin/challenge-offers/[offerId]/route.ts',
  'app/api/admin/marketing-insights/[challengeId]/route.ts',
  'app/api/admin/product-opportunities/[challengeId]/route.ts',
  'app/api/admin/segments/[challengeId]/route.ts'
];

console.log('🚨 Repariere kritische Admin-Sicherheitslücken...\n');

adminFiles.forEach(file => {
  fixAdminAPI(file);
});

console.log('\n✅ Alle Admin-APIs gesichert!');
console.log('🔒 Jeder Admin-Endpunkt benötigt jetzt requireAdmin()');
console.log('🚀 Sicherheitslücken geschlossen!');
