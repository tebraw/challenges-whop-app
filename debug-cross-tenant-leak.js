// CRITICAL: Debug Cross-Tenant Challenge Visibility
const { PrismaClient } = require('@prisma/client');

async function debugCrossTenantContamination() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 CRITICAL SECURITY ANALYSIS: Cross-Tenant Challenge Visibility\n');
    
    // Get all challenges with their tenant info
    const allChallenges = await prisma.challenge.findMany({
      include: {
        tenant: true,
        creator: {
          include: {
            tenant: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Total challenges in database: ${allChallenges.length}\n`);
    
    if (allChallenges.length === 0) {
      console.log('No challenges found in database');
      return;
    }
    
    // Analyze each challenge
    allChallenges.forEach((challenge, index) => {
      console.log(`🎯 CHALLENGE ${index + 1}: "${challenge.title}"`);
      console.log(`   Challenge ID: ${challenge.id}`);
      console.log(`   Challenge.tenantId: ${challenge.tenantId}`);
      console.log(`   Challenge.whopCompanyId: ${challenge.whopCompanyId || 'NULL'}`);
      console.log(`   Tenant.whopCompanyId: ${challenge.tenant?.whopCompanyId || 'NULL'}`);
      console.log(`   Creator.tenantId: ${challenge.creator?.tenantId || 'NULL'}`);
      console.log(`   Creator.tenant.whopCompanyId: ${challenge.creator?.tenant?.whopCompanyId || 'NULL'}`);
      
      // Check for inconsistencies
      const challengeCompany = challenge.whopCompanyId;
      const tenantCompany = challenge.tenant?.whopCompanyId;
      const creatorTenantCompany = challenge.creator?.tenant?.whopCompanyId;
      
      const inconsistencies = [];
      
      if (challengeCompany !== tenantCompany) {
        inconsistencies.push(`Challenge.whopCompanyId (${challengeCompany}) ≠ Tenant.whopCompanyId (${tenantCompany})`);
      }
      
      if (challenge.tenantId !== challenge.creator?.tenantId) {
        inconsistencies.push(`Challenge.tenantId (${challenge.tenantId}) ≠ Creator.tenantId (${challenge.creator?.tenantId})`);
      }
      
      if (tenantCompany !== creatorTenantCompany) {
        inconsistencies.push(`Tenant.whopCompanyId (${tenantCompany}) ≠ Creator.tenant.whopCompanyId (${creatorTenantCompany})`);
      }
      
      if (inconsistencies.length > 0) {
        console.log(`   🚨 INCONSISTENCIES FOUND:`);
        inconsistencies.forEach(issue => {
          console.log(`     ❌ ${issue}`);
        });
      } else {
        console.log(`   ✅ Data consistency OK`);
      }
      
      console.log();
    });
    
    // Check for challenges that could be visible to wrong companies
    console.log('🔍 TESTING API ISOLATION FOR EACH COMPANY...\n');
    
    const tenants = await prisma.tenant.findMany({
      where: {
        whopCompanyId: {
          not: null
        }
      }
    });
    
    for (const tenant of tenants) {
      console.log(`🏢 Company: ${tenant.whopCompanyId} (Tenant ID: ${tenant.id})`);
      
      // What this company SHOULD see (correct isolation)
      const correctChallenges = await prisma.challenge.findMany({
        where: {
          tenantId: tenant.id
        }
      });
      
      console.log(`   ✅ Should see: ${correctChallenges.length} challenges`);
      correctChallenges.forEach(challenge => {
        console.log(`     - "${challenge.title}" (${challenge.id})`);
      });
      
      // Check if there are potential leaks
      const allOtherChallenges = await prisma.challenge.findMany({
        where: {
          tenantId: { not: tenant.id }
        }
      });
      
      if (allOtherChallenges.length > 0) {
        console.log(`   ❌ Should NOT see: ${allOtherChallenges.length} other companies' challenges`);
        allOtherChallenges.forEach(challenge => {
          console.log(`     - "${challenge.title}" (${challenge.id}) - belongs to tenant ${challenge.tenantId}`);
        });
      }
      
      // Check for any challenges with wrong whopCompanyId but correct tenantId
      const potentialLeaks = await prisma.challenge.findMany({
        where: {
          tenantId: tenant.id,
          whopCompanyId: { not: tenant.whopCompanyId }
        }
      });
      
      if (potentialLeaks.length > 0) {
        console.log(`   🚨 POTENTIAL LEAKS: ${potentialLeaks.length} challenges with wrong whopCompanyId`);
        potentialLeaks.forEach(challenge => {
          console.log(`     - "${challenge.title}": tenantId=${challenge.tenantId}, whopCompanyId=${challenge.whopCompanyId}`);
        });
      }
      
      console.log();
    }
    
    // Summary and recommendations
    console.log('📋 SECURITY SUMMARY:');
    const totalTenants = tenants.length;
    const totalChallenges = allChallenges.length;
    
    console.log(`Companies: ${totalTenants}`);
    console.log(`Total challenges: ${totalChallenges}`);
    
    // Check for data integrity issues
    const challengesWithoutTenant = allChallenges.filter(c => !c.tenant);
    const challengesWithWrongCompanyId = allChallenges.filter(c => c.whopCompanyId !== c.tenant?.whopCompanyId);
    
    if (challengesWithoutTenant.length > 0) {
      console.log(`🚨 ${challengesWithoutTenant.length} challenges have no tenant!`);
    }
    
    if (challengesWithWrongCompanyId.length > 0) {
      console.log(`🚨 ${challengesWithWrongCompanyId.length} challenges have mismatched company IDs!`);
    }
    
    if (challengesWithoutTenant.length === 0 && challengesWithWrongCompanyId.length === 0) {
      console.log(`✅ Database integrity appears correct`);
      console.log(`🤔 The issue might be in the frontend or API logic`);
    }
    
  } catch (error) {
    console.error('Error analyzing cross-tenant contamination:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCrossTenantContamination();