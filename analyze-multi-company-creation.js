// DETAILED ANALYSIS: Multi-Company Challenge Creation
const { PrismaClient } = require('@prisma/client');

async function analyzeMultiCompanyCreation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🕵️ DETAILED ANALYSIS: Multi-Company Challenge Creation\n');
    
    // Get all challenges with detailed creator and tenant info
    const allChallenges = await prisma.challenge.findMany({
      include: {
        creator: {
          include: {
            tenant: true
          }
        },
        tenant: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${allChallenges.length} total challenges\n`);
    
    allChallenges.forEach((challenge, index) => {
      console.log(`🎯 CHALLENGE ${index + 1}: "${challenge.title}"`);
      console.log(`   Challenge ID: ${challenge.id}`);
      console.log(`   Created: ${challenge.createdAt}`);
      console.log(`   📊 Challenge Data:`);
      console.log(`     tenantId: ${challenge.tenantId}`);
      console.log(`     whopCompanyId: ${challenge.whopCompanyId || 'NULL'}`);
      console.log(`   👤 Creator Info:`);
      console.log(`     creatorId: ${challenge.creatorId || 'NULL'}`);
      console.log(`     creator.email: ${challenge.creator?.email || 'NULL'}`);
      console.log(`     creator.whopCompanyId: ${challenge.creator?.whopCompanyId || 'NULL'}`);
      console.log(`     creator.tenantId: ${challenge.creator?.tenantId || 'NULL'}`);
      console.log(`   🏢 Tenant Info:`);
      console.log(`     tenant.id: ${challenge.tenant?.id || 'NULL'}`);
      console.log(`     tenant.whopCompanyId: ${challenge.tenant?.whopCompanyId || 'NULL'}`);
      console.log(`     tenant.name: ${challenge.tenant?.name || 'NULL'}`);
      console.log(`   🔍 Creator's Tenant:`);
      console.log(`     creator.tenant.id: ${challenge.creator?.tenant?.id || 'NULL'}`);
      console.log(`     creator.tenant.whopCompanyId: ${challenge.creator?.tenant?.whopCompanyId || 'NULL'}`);
      
      // Check for inconsistencies
      const issues = [];
      
      if (challenge.tenantId !== challenge.creator?.tenantId) {
        issues.push(`Challenge tenant (${challenge.tenantId}) ≠ Creator tenant (${challenge.creator?.tenantId})`);
      }
      
      if (challenge.whopCompanyId !== challenge.creator?.whopCompanyId) {
        issues.push(`Challenge company (${challenge.whopCompanyId}) ≠ Creator company (${challenge.creator?.whopCompanyId})`);
      }
      
      if (challenge.whopCompanyId !== challenge.tenant?.whopCompanyId) {
        issues.push(`Challenge company (${challenge.whopCompanyId}) ≠ Tenant company (${challenge.tenant?.whopCompanyId})`);
      }
      
      if (challenge.creator?.tenantId !== challenge.creator?.tenant?.id) {
        issues.push(`Creator tenantId (${challenge.creator?.tenantId}) ≠ Creator tenant ID (${challenge.creator?.tenant?.id})`);
      }
      
      if (issues.length > 0) {
        console.log(`   🚨 ISSUES DETECTED:`);
        issues.forEach(issue => console.log(`     ❌ ${issue}`));
      } else {
        console.log(`   ✅ No data inconsistencies`);
      }
      
      console.log();
    });
    
    // Analyze by company
    console.log('🏢 ANALYSIS BY COMPANY:\n');
    
    const companies = await prisma.tenant.findMany({
      where: {
        whopCompanyId: { not: null }
      },
      include: {
        challenges: {
          include: {
            creator: true
          }
        },
        users: true
      }
    });
    
    companies.forEach(company => {
      console.log(`🏢 COMPANY: ${company.whopCompanyId} (${company.name})`);
      console.log(`   Tenant ID: ${company.id}`);
      console.log(`   Users: ${company.users.length}`);
      console.log(`   Challenges: ${company.challenges.length}`);
      
      company.challenges.forEach((challenge, index) => {
        console.log(`   ${index + 1}. "${challenge.title}"`);
        console.log(`      Created by: ${challenge.creator?.email || 'Unknown'}`);
        console.log(`      Challenge whopCompanyId: ${challenge.whopCompanyId || 'NULL'}`);
        console.log(`      Creator whopCompanyId: ${challenge.creator?.whopCompanyId || 'NULL'}`);
      });
      
      console.log();
    });
    
    // Check what each company's API would return
    console.log('🔍 API SIMULATION: What each company sees via /api/admin/challenges\n');
    
    for (const company of companies) {
      console.log(`🏢 Testing API for: ${company.whopCompanyId}`);
      
      // Current broken API (only by tenantId)
      const brokenAPI = await prisma.challenge.findMany({
        where: {
          tenantId: company.id
        }
      });
      
      // Fixed API (tenantId + whopCompanyId)
      const fixedAPI = await prisma.challenge.findMany({
        where: {
          tenantId: company.id,
          whopCompanyId: company.whopCompanyId
        }
      });
      
      console.log(`   ❌ Broken API (only tenantId): ${brokenAPI.length} challenges`);
      brokenAPI.forEach(challenge => {
        console.log(`     - "${challenge.title}" (whopCompanyId: ${challenge.whopCompanyId || 'NULL'})`);
      });
      
      console.log(`   ✅ Fixed API (tenantId + whopCompanyId): ${fixedAPI.length} challenges`);
      fixedAPI.forEach(challenge => {
        console.log(`     - "${challenge.title}" (whopCompanyId: ${challenge.whopCompanyId})`);
      });
      
      console.log();
    }
    
    // Summary
    const totalChallenges = allChallenges.length;
    const challengesWithWhopId = allChallenges.filter(c => c.whopCompanyId).length;
    const challengesWithoutWhopId = totalChallenges - challengesWithWhopId;
    
    console.log('📊 SECURITY SUMMARY:');
    console.log(`Total challenges: ${totalChallenges}`);
    console.log(`With whopCompanyId: ${challengesWithWhopId}`);
    console.log(`WITHOUT whopCompanyId: ${challengesWithoutWhopId} 🚨`);
    
    if (challengesWithoutWhopId > 0) {
      console.log('\n🚨 ROOT CAUSE: Challenges without whopCompanyId are visible to ALL companies!');
      console.log('💡 SOLUTION: Fix existing challenges AND update creation logic');
    }
    
  } catch (error) {
    console.error('Error in analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeMultiCompanyCreation();