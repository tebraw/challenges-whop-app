// Debug Script: Tenant Isolation Analysis
const { PrismaClient } = require('@prisma/client');

async function debugTenantIsolation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Analyzing Tenant Isolation...\n');
    
    // 1. Check all tenants
    const tenants = await prisma.tenant.findMany({
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${tenants.length} tenants:`);
    tenants.forEach(tenant => {
      console.log(`  - Tenant ID: ${tenant.id}`);
      console.log(`    Name: ${tenant.name}`);
      console.log(`    Company ID: ${tenant.whopCompanyId || 'None'}`);
      console.log(`    Challenges: ${tenant.challenges.length}`);
      tenant.challenges.forEach(challenge => {
        console.log(`      * ${challenge.title} (${challenge.id})`);
      });
      console.log('');
    });
    
    // 2. Check all challenges and their tenant assignment
    const allChallenges = await prisma.challenge.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            whopCompanyId: true
          }
        }
      }
    });
    
    console.log(`📋 All Challenges (${allChallenges.length}):`);
    allChallenges.forEach(challenge => {
      console.log(`  - Challenge: ${challenge.title}`);
      console.log(`    ID: ${challenge.id}`);
      console.log(`    Tenant: ${challenge.tenant.name} (${challenge.tenant.id})`);
      console.log(`    Company: ${challenge.tenant.whopCompanyId || 'None'}`);
      console.log('');
    });
    
    // 3. Check for duplicate whopCompanyId
    const companyIds = tenants.map(t => t.whopCompanyId).filter(Boolean);
    const duplicateCompanies = companyIds.filter((id, index) => companyIds.indexOf(id) !== index);
    
    if (duplicateCompanies.length > 0) {
      console.log('🚨 PROBLEM: Duplicate Company IDs found!');
      duplicateCompanies.forEach(companyId => {
        console.log(`  Duplicate: ${companyId}`);
      });
    } else {
      console.log('✅ No duplicate Company IDs found');
    }
    
    // 4. Check for challenges without proper tenant isolation
    console.log('\n🔍 Tenant Isolation Check:');
    const tenantGroups = {};
    allChallenges.forEach(challenge => {
      const companyId = challenge.tenant.whopCompanyId;
      if (!tenantGroups[companyId]) {
        tenantGroups[companyId] = [];
      }
      tenantGroups[companyId].push(challenge);
    });
    
    Object.keys(tenantGroups).forEach(companyId => {
      const challenges = tenantGroups[companyId];
      console.log(`  Company ${companyId}: ${challenges.length} challenges`);
      if (challenges.length > 0) {
        challenges.forEach(c => console.log(`    - ${c.title}`));
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTenantIsolation();