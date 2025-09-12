const fs = require('fs');
const path = require('path');

function fixExperienceIdIssues() {
  console.log('🔧 Fixing experienceId issues in experience API routes...');
  
  const experienceApiDir = path.join(__dirname, 'app', 'api', 'experience');
  
  function processFile(filePath) {
    if (!filePath.endsWith('.ts')) return;
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Remove requireAccess import
      if (content.includes('import { requireAccess }')) {
        content = content.replace(/import { requireAccess }[^;]*;?\n?/g, '');
        modified = true;
      }
      
      // Find and remove duplicate experienceId declarations
      const lines = content.split('\n');
      const newLines = [];
      let foundFirstExperienceId = false;
      let skippedRequireAccess = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip requireAccess function calls
        if (line.includes('await requireAccess(experienceId')) {
          if (!skippedRequireAccess) {
            skippedRequireAccess = true;
            modified = true;
          }
          continue;
        }
        
        // Handle experienceId declarations
        if (line.includes('const experienceId =')) {
          if (!foundFirstExperienceId) {
            newLines.push(line);
            foundFirstExperienceId = true;
          } else {
            // Skip duplicate experienceId declaration
            modified = true;
            continue;
          }
        } else {
          newLines.push(line);
        }
      }
      
      if (modified) {
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
    console.log('✅ Experience API routes fixed!');
  } else {
    console.log('ℹ️ No experience API directory found');
  }
}

fixExperienceIdIssues();