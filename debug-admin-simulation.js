// Debug Script: Admin Access Simulation
const { PrismaClient } = require('@prisma/client');

async function simulateAdminAccess() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎭 Simulating Admin Access for Different Companies...\n');
    
    // Simulate two different company owners
    const testCompanies = [
      '9nmw5yleoqldrxf7n48c', // Your company
      'testcompany123456',    // Another company
      '',                     // Empty company (problem case)
      null                    // Null company (problem case)
    ];
    
    for (const companyId of testCompanies) {
      console.log(`\n🏢 Testing Company: "${companyId || 'EMPTY/NULL'}"`);
      
      // Simulate the tenant lookup/creation logic
      let tenant = await prisma.tenant.findUnique({
        where: { whopCompanyId: companyId }
      });
      
      if (!tenant) {
        console.log(`  ❌ No tenant found for company: ${companyId}`);
        if (companyId) {
          console.log(`  🏗️ Would create tenant for: ${companyId}`);
        } else {
          console.log(`  🚨 PROBLEM: Empty/null company would cause issues!`);
        }
      } else {
        console.log(`  ✅ Found tenant: ${tenant.name} (${tenant.id})`);
      }
      
      // Show what challenges this company would see
      if (tenant) {
        const challenges = await prisma.challenge.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, title: true, createdAt: true }
        });
        
        console.log(`  📋 Challenges visible: ${challenges.length}`);
        challenges.forEach(c => {
          console.log(`    - ${c.title} (${c.id})`);
        });
      }
    }
    
    // Check for orphaned challenges (challenges with tenants that have no company)
    console.log('\n🔍 Looking for orphaned challenges...');
    const orphanedTenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { whopCompanyId: null },
          { whopCompanyId: '' }
        ]
      },
      include: {
        challenges: {
          select: { id: true, title: true }
        }
      }
    });
    
    if (orphanedTenants.length > 0) {
      console.log(`🚨 Found ${orphanedTenants.length} orphaned tenants:`);
      orphanedTenants.forEach(tenant => {
        console.log(`  - Tenant: ${tenant.name} (${tenant.id})`);
        console.log(`    Company ID: ${tenant.whopCompanyId || 'NULL/EMPTY'}`);
        console.log(`    Challenges: ${tenant.challenges.length}`);
        tenant.challenges.forEach(c => {
          console.log(`      * ${c.title} (${c.id})`);
        });
      });
      
      console.log('\n💡 SOLUTION: These orphaned tenants should be cleaned up or fixed!');
    } else {
      console.log('✅ No orphaned tenants found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateAdminAccess();