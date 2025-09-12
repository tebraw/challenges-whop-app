const fs = require('fs');
const path = require('path');

function fixExperienceIdParamsIssues() {
  console.log('🔧 Fixing experienceId params issues in experience API routes...');
  
  const experienceApiDir = path.join(__dirname, 'app', 'api', 'experience');
  
  function processFile(filePath) {
    if (!filePath.endsWith('.ts')) return;
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Fix the problematic params access pattern
      const badPattern = /const experienceId = \(params\?\.experienceId.*?\) as string;/g;
      if (badPattern.test(content)) {
        // Remove the problematic line
        content = content.replace(badPattern, '');
        
        // Remove empty comment lines left behind
        content = content.replace(/\s*\/\/ Whop Experience access guard\s*\n/g, '');
        
        modified = true;
      }
      
      // Fix function parameters and body
      const lines = content.split('\n');
      const newLines = [];
      let insideFunctionParams = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if we're at the function signature
        if (line.includes('export async function') && (line.includes('GET') || line.includes('POST'))) {
          insideFunctionParams = true;
          newLines.push(line);
          continue;
        }
        
        // Skip until we reach the opening brace of the function body
        if (insideFunctionParams && line.includes(') {')) {
          insideFunctionParams = false;
          newLines.push(line);
          
          // Add the try block start if it's not already there
          if (i + 1 < lines.length && !lines[i + 1].trim().startsWith('try')) {
            newLines.push('  try {');
            newLines.push('    const { experienceId' + (line.includes('challengeId') ? ', challengeId' : '') + ' } = await params;');
          }
          continue;
        }
        
        // Skip lines that try to destructure params inside try block if we already added it
        if (line.includes('const { experienceId') && line.includes('} = await params;')) {
          // Only keep one instance
          if (!newLines.some(nl => nl.includes('const { experienceId') && nl.includes('} = await params;'))) {
            newLines.push(line);
          }
          continue;
        }
        
        newLines.push(line);
      }
      
      if (modified || newLines.length !== lines.length) {
        const newContent = newLines.join('\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Fixed: ${path.relative(__dirname, filePath)}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  function walkDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDirectory(fullPath);
        } else if (stat.isFile()) {
          processFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error walking directory ${dir}:`, error.message);
    }
  }
  
  if (fs.existsSync(experienceApiDir)) {
    walkDirectory(experienceApiDir);
    console.log('✅ Experience API params issues fixed!');
  } else {
    console.log('ℹ️ No experience API directory found');
  }
}

fixExperienceIdParamsIssues();