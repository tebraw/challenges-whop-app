// Security audit script to check tenant isolation
const fs = require('fs');
const path = require('path');

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // Check for dangerous patterns
  if (content.includes('findFirst') && content.includes('ADMIN')) {
    issues.push('⚠️ findFirst with ADMIN - potential cross-tenant access');
  }
  
  if (content.includes('findMany') && !content.includes('tenantId') && !content.includes('experienceId')) {
    issues.push('🚨 findMany without tenant isolation');
  }
  
  if (content.includes('fallback') || content.includes('Fallback')) {
    issues.push('⚠️ Contains fallback logic - check for security issues');
  }
  
  return issues;
}

function auditDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  const results = {};
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const subResults = auditDirectory(fullPath);
      Object.assign(results, subResults);
    } else if (file.endsWith('.ts')) {
      const issues = auditFile(fullPath);
      if (issues.length > 0) {
        results[fullPath] = issues;
      }
    }
  }
  
  return results;
}

console.log('🔍 Security Audit: Admin API Tenant Isolation\n');

const adminApiDir = 'app/api/admin';
const results = auditDirectory(adminApiDir);

if (Object.keys(results).length === 0) {
  console.log('✅ No obvious security issues found in admin APIs');
} else {
  console.log('🚨 SECURITY ISSUES FOUND:\n');
  
  for (const [file, issues] of Object.entries(results)) {
    console.log(`📁 ${file}:`);
    issues.forEach(issue => console.log(`  ${issue}`));
    console.log('');
  }
}

console.log('\n🎯 Manual checks needed:');
console.log('1. Verify all findMany queries include tenant/experience filtering');
console.log('2. Check that user authentication properly validates tenant access');
console.log('3. Ensure no cross-tenant data leakage in responses');
console.log('4. Review all fallback authentication mechanisms');