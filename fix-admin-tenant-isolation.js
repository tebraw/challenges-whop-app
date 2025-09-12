// fix-admin-tenant-isolation.js
// Script to systematically fix tenant isolation in all admin endpoints

const fs = require('fs');
const path = require('path');

const adminApiDir = 'app/api/admin';

// Find all admin API route files
function findRouteFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (entry.name === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Check if file has tenant isolation issues
function checkTenantIsolation(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const issues = [];
  
  // Check for challenge.findUnique without tenantId (more specific patterns)
  const challengeFindUniqueLines = content.split('\n').filter(line => 
    line.includes('challenge.findUnique') || 
    line.includes('prisma.challenge.findUnique')
  );
  
  for (const line of challengeFindUniqueLines) {
    if (!content.includes('tenantId: user.tenantId') && !content.includes('tenantId: currentUser.tenantId')) {
      issues.push(`challenge.findUnique missing tenant isolation: ${line.trim()}`);
    }
  }
  
  // Check for challenge.findMany without tenantId
  const challengeFindManyLines = content.split('\n').filter(line => 
    line.includes('challenge.findMany') || 
    line.includes('prisma.challenge.findMany')
  );
  
  for (const line of challengeFindManyLines) {
    if (!content.includes('tenantId: user.tenantId') && !content.includes('tenantId: currentUser.tenantId')) {
      issues.push(`challenge.findMany missing tenant isolation: ${line.trim()}`);
    }
  }
  
  // Check for requireAdmin() without getCurrentUser()
  if (content.includes('requireAdmin()') && !content.includes('getCurrentUser()')) {
    issues.push('requireAdmin() without user context');
  }
  
  return issues;
}

console.log('🔍 SCANNING ADMIN API ENDPOINTS FOR TENANT ISOLATION ISSUES\n');

try {
  const routeFiles = findRouteFiles(adminApiDir);
  
  console.log(`Found ${routeFiles.length} admin route files:\n`);
  
  let totalIssues = 0;
  
  for (const file of routeFiles) {
    const issues = checkTenantIsolation(file);
    
    if (issues.length > 0) {
      console.log(`❌ ${file}:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('');
      totalIssues += issues.length;
    } else {
      console.log(`✅ ${file}: OK`);
    }
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`Total route files: ${routeFiles.length}`);
  console.log(`Files with issues: ${routeFiles.filter(f => checkTenantIsolation(f).length > 0).length}`);
  console.log(`Total security issues: ${totalIssues}`);
  
  if (totalIssues > 0) {
    console.log('\n🚨 CRITICAL: Multiple admin endpoints lack tenant isolation!');
    console.log('This means company owners can access other companies\' data!');
  } else {
    console.log('\n✅ All admin endpoints have proper tenant isolation!');
  }

} catch (error) {
  console.error('Error scanning files:', error);
}
