// debug-current-auth-flow.js
// Find out which auth function is being called when colleague accesses the app

const fs = require('fs');
const path = require('path');

function searchInFile(filePath, searchTerm) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchTerm)) {
      const lines = content.split('\n');
      const matches = [];
      lines.forEach((line, index) => {
        if (line.includes(searchTerm)) {
          matches.push({
            line: index + 1,
            content: line.trim()
          });
        }
      });
      return matches;
    }
  } catch (error) {
    // File doesn't exist or can't be read
  }
  return [];
}

function searchInDirectory(dir, searchTerm, fileExtensions = ['.ts', '.tsx', '.js']) {
  const results = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules') {
          scanDir(fullPath);
        }
      } else if (fileExtensions.some(ext => item.endsWith(ext))) {
        const matches = searchInFile(fullPath, searchTerm);
        if (matches.length > 0) {
          results.push({
            file: fullPath,
            matches: matches
          });
        }
      }
    }
  }
  
  scanDir(dir);
  return results;
}

console.log('🔍 DEBUGGING CURRENT AUTH FLOW');
console.log('==============================');

// Check which functions are calling getCurrentUser
console.log('\n1. WHO CALLS getCurrentUser()?');
const getCurrentUserCalls = searchInDirectory('.', 'getCurrentUser');
console.log(`Found ${getCurrentUserCalls.length} files calling getCurrentUser:`);

getCurrentUserCalls.forEach((result, index) => {
  console.log(`\n${index + 1}. ${result.file}`);
  result.matches.forEach(match => {
    console.log(`   Line ${match.line}: ${match.content}`);
  });
});

// Check which functions are calling autoCreateOrUpdateUser
console.log('\n\n2. WHO CALLS autoCreateOrUpdateUser()?');
const autoCreateCalls = searchInDirectory('.', 'autoCreateOrUpdateUser');
console.log(`Found ${autoCreateCalls.length} files calling autoCreateOrUpdateUser:`);

autoCreateCalls.forEach((result, index) => {
  console.log(`\n${index + 1}. ${result.file}`);
  result.matches.forEach(match => {
    console.log(`   Line ${match.line}: ${match.content}`);
  });
});

// Check for any remaining hardcoded fallback values
console.log('\n\n3. LOOKING FOR ACTIVE FALLBACK SOURCES:');
const fallbackSources = [
  'lib/whop-experience.ts',
  'lib/auth.ts', 
  'lib/auto-company-extraction.ts',
  'middleware.ts',
  'app/api/auth',
];

fallbackSources.forEach(sourcePath => {
  if (fs.existsSync(sourcePath)) {
    console.log(`\n✅ Checking: ${sourcePath}`);
    const fallbackMatches = searchInFile(sourcePath, '9nmw5yleoqldrxf7n48c');
    if (fallbackMatches.length > 0) {
      console.log(`   🚨 FOUND HARDCODED FALLBACK!`);
      fallbackMatches.forEach(match => {
        console.log(`      Line ${match.line}: ${match.content}`);
      });
    } else {
      console.log(`   ✅ No hardcoded fallbacks found`);
    }
  }
});

console.log('\n\n4. CONCLUSION:');
console.log('The mystery company ID is coming from one of these sources:');
console.log('- Old auth.ts getCurrentUser() function (still has fallback logic)');
console.log('- Whop headers actually containing this value');
console.log('- Some other API endpoint creating users');
console.log('\nNeed to check which auth function is actually being called!');