// scripts/fix-imports.js
const fs = require('fs');
const path = require('path');

const adminFiles = [
  'app/api/admin/marketing-insights/[challengeId]/route.ts',
  'app/api/admin/product-opportunities/[challengeId]/route.ts', 
  'app/api/admin/segments/[challengeId]/route.ts'
];

adminFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Datei nicht gefunden: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if requireAdmin import is missing
  if (content.includes('await requireAdmin()') && !content.includes('import { requireAdmin }')) {
    // Add import
    content = content.replace(
      /import { NextResponse } from ['"]next\/server['"];?\n/,
      `import { NextResponse } from 'next/server';\nimport { requireAdmin } from '@/lib/auth';\n`
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`🔧 ${filePath} - Import hinzugefügt`);
  } else {
    console.log(`✅ ${filePath} - bereits korrekt`);
  }
});

console.log('✅ Alle Imports repariert!');
