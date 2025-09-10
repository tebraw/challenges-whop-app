// fix-typescript-errors.js
// Systematically fix TypeScript errors in admin analytics routes

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING TYPESCRIPT ERRORS IN ADMIN ROUTES\n');

const filesToFix = [
  'app/api/admin/analytics/[challengeId]/route.ts',
  'app/api/admin/segments/[challengeId]/route.ts'
];

const typeScriptFixes = [
  // Basic enrollment filters
  { find: /challenge\.enrollments\.filter\(e =>/g, replace: 'challenge.enrollments.filter((e: any) =>' },
  { find: /challenge\.enrollments\.map\(e =>/g, replace: 'challenge.enrollments.map((e: any) =>' },
  { find: /challenge\.enrollments\.map\(enrollment =>/g, replace: 'challenge.enrollments.map((enrollment: any) =>' },
  { find: /challenge\.enrollments\.reduce\(\(sum, e\) =>/g, replace: 'challenge.enrollments.reduce((sum: number, e: any) =>' },
  
  // Checkins filters
  { find: /\.checkins\.filter\(c =>/g, replace: '.checkins.filter((c: any) =>' },
  { find: /\.checkins\.some\(c =>/g, replace: '.checkins.some((c: any) =>' },
  
  // Array operations
  { find: /\.filter\(p =>/g, replace: '.filter((p: any) =>' },
  { find: /\.filter\(u =>/g, replace: '.filter((u: any) =>' },
  { find: /\.map\(u =>/g, replace: '.map((u: any) =>' },
  { find: /\.sort\(\(a, b\) =>/g, replace: '.sort((a: any, b: any) =>' },
  { find: /\.reduce\(\(sum, u\) =>/g, replace: '.reduce((sum: number, u: any) =>' },
  { find: /\.reduce\(\(sum, t\) =>/g, replace: '.reduce((sum: number, t: any) =>' },
  
  // forEach operations
  { find: /\.forEach\(checkin =>/g, replace: '.forEach((checkin: any) =>' }
];

filesToFix.forEach(filePath => {
  try {
    console.log(`🔍 Processing: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changesMade = 0;
    
    typeScriptFixes.forEach(fix => {
      const beforeCount = (content.match(fix.find) || []).length;
      content = content.replace(fix.find, fix.replace);
      const afterCount = (content.match(fix.find) || []).length;
      const fixesMade = beforeCount - afterCount;
      if (fixesMade > 0) {
        changesMade += fixesMade;
        console.log(`   ✅ Fixed ${fixesMade} instances of: ${fix.find.source}`);
      }
    });
    
    if (changesMade > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`   🎉 Total changes made: ${changesMade}\n`);
    } else {
      console.log(`   ✅ No changes needed\n`);
    }
    
  } catch (error) {
    console.error(`   ❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('🎯 TypeScript error fixing complete!');
