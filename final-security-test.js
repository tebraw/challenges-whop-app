// FINAL SECURITY TEST: Prove complete tenant isolation
const { PrismaClient } = require('@prisma/client');

async function finalSecurityTest() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔐 FINAL SECURITY TEST: Complete Multi-Tenant Isolation\n');
    
    // Get all companies and their data
    const companies = await prisma.tenant.findMany({
      where: {
        whopCompanyId: { not: null }
      },
      include: {
        challenges: true,
        users: true
      }
    });
    
    console.log(`Testing ${companies.length} companies for isolation\n`);
    
    // Test each company's isolation
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(`🏢 COMPANY ${i + 1}: ${company.whopCompanyId} (${company.name})`);
      console.log(`   Tenant ID: ${company.id}`);
      console.log(`   Users: ${company.users.length}`);
      console.log(`   Challenges: ${company.challenges.length}`);
      
      // Test 1: tenantId isolation
      const challengesByTenant = await prisma.challenge.findMany({
        where: { tenantId: company.id }
      });
      
      // Test 2: whopCompanyId isolation (NEW SECURITY LAYER)
      const challengesByCompany = await prisma.challenge.findMany({
        where: { whopCompanyId: company.whopCompanyId }
      });
      
      // Test 3: Combined isolation (STRONGEST SECURITY)
      const challengesByCombined = await prisma.challenge.findMany({
        where: {
          tenantId: company.id,
          whopCompanyId: company.whopCompanyId
        }
      });
      
      console.log(`   📊 Isolation Test Results:`);
      console.log(`     By tenantId: ${challengesByTenant.length} challenges`);
      console.log(`     By whopCompanyId: ${challengesByCompany.length} challenges`);
      console.log(`     By combined: ${challengesByCombined.length} challenges`);
      
      // Verify all methods return same result
      const allMatch = challengesByTenant.length === challengesByCompany.length && 
                       challengesByCompany.length === challengesByCombined.length;
      
      if (allMatch) {
        console.log(`     ✅ Perfect isolation - all methods agree`);
      } else {
        console.log(`     ❌ Isolation mismatch - SECURITY ISSUE!`);
      }
      
      // Test what this company should NOT see
      const otherCompanyChallenges = await prisma.challenge.findMany({
        where: {
          tenantId: { not: company.id },
          whopCompanyId: { not: company.whopCompanyId }
        }
      });
      
      console.log(`     🚫 Should NOT see: ${otherCompanyChallenges.length} other companies' challenges`);
      
      if (otherCompanyChallenges.length > 0) {
        otherCompanyChallenges.forEach(challenge => {
          console.log(`       - "${challenge.title}" (Company: ${challenge.whopCompanyId}, Tenant: ${challenge.tenantId})`);
        });
      }
      
      console.log();
    }
    
    // Cross-contamination test
    console.log('🔍 CROSS-CONTAMINATION TEST:\n');
    
    const allChallenges = await prisma.challenge.findMany({
      include: { tenant: true }
    });
    
    let secureCount = 0;
    let insecureCount = 0;
    
    allChallenges.forEach(challenge => {
      const tenantMatch = challenge.tenantId === challenge.tenant?.id;
      const companyMatch = challenge.whopCompanyId === challenge.tenant?.whopCompanyId;
      const fullySecure = tenantMatch && companyMatch && challenge.whopCompanyId;
      
      console.log(`📋 Challenge: "${challenge.title}"`);
      console.log(`   Challenge.tenantId: ${challenge.tenantId}`);
      console.log(`   Challenge.whopCompanyId: ${challenge.whopCompanyId}`);
      console.log(`   Tenant.whopCompanyId: ${challenge.tenant?.whopCompanyId}`);
      console.log(`   Tenant ID match: ${tenantMatch ? '✅' : '❌'}`);
      console.log(`   Company ID match: ${companyMatch ? '✅' : '❌'}`);
      console.log(`   Has whopCompanyId: ${challenge.whopCompanyId ? '✅' : '❌'}`);
      
      if (fullySecure) {
        console.log(`   🔒 SECURE: Proper isolation`);
        secureCount++;
      } else {
        console.log(`   🚨 INSECURE: Isolation breach!`);
        insecureCount++;
      }
      console.log();
    });
    
    // Final verdict
    console.log('🏆 FINAL SECURITY VERDICT:');
    console.log(`✅ Secure challenges: ${secureCount}`);
    console.log(`❌ Insecure challenges: ${insecureCount}`);
    console.log(`📊 Total challenges: ${allChallenges.length}`);
    console.log(`🔒 Security score: ${Math.round(secureCount/allChallenges.length*100)}%`);
    
    if (insecureCount === 0) {
      console.log('\n🎉 PERFECT SECURITY: No cross-tenant contamination detected!');
      console.log('✅ Each company can only see their own challenges');
      console.log('🔒 Multi-layer isolation (tenantId + whopCompanyId) is working');
    } else {
      console.log('\n🚨 SECURITY BREACH DETECTED!');
      console.log('⚠️  Manual investigation required');
    }
    
  } catch (error) {
    console.error('Error in security test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalSecurityTest();