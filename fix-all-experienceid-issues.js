// Script to fix all experienceId duplicate declaration issues in admin API routes
const fs = require('fs').promises;
const path = require('path');

async function fixExperienceIdDuplicates() {
  const adminApiDir = './app/api/admin';
  
  // Find all TypeScript files in admin API directory
  const files = await findTSFiles(adminApiDir);
  
  console.log(`🔍 Found ${files.length} TypeScript files to check`);
  
  for (const filePath of files) {
    try {
      await fixFile(filePath);
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  }
  
  console.log('✅ Finished fixing all files');
}

async function findTSFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function fixFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  
  // Check if file has the problematic patterns
  const hasRequireAccess = content.includes('requireAccess');
  const hasExperienceId = content.includes('experienceId');
  
  if (!hasRequireAccess && !hasExperienceId) {
    return; // Nothing to fix
  }
  
  console.log(`🔧 Fixing ${filePath}`);
  
  let newContent = content;
  
  // Remove requireAccess import
  newContent = newContent.replace(
    /import\s*{\s*requireAccess[^}]*}\s*from\s*["'][^"']*["'];\s*\n?/g,
    ''
  );
  
  // Remove duplicate experienceId declarations and requireAccess calls
  newContent = newContent.replace(
    /\/\/\s*Whop Experience access guard[\s\S]*?await requireAccess\(experienceId,\s*["']admin["']\);\s*\n/g,
    ''
  );
  
  // Clean up any remaining standalone requireAccess calls
  newContent = newContent.replace(
    /\s*await requireAccess\([^)]*\);\s*\n?/g,
    ''
  );
  
  // Clean up any remaining experienceId declarations that reference params
  newContent = newContent.replace(
    /\s*const experienceId = \(params\?\.[^;]*;\s*\n?/g,
    ''
  );
  
  // Clean up extra whitespace
  newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Only write if content changed
  if (newContent !== content) {
    await fs.writeFile(filePath, newContent, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  }
}

// Run the fix
fixExperienceIdDuplicates().catch(console.error);