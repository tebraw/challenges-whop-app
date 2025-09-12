// SECURITY FIX: Update existing challenges with whopCompanyId
const { PrismaClient } = require('@prisma/client');

async function fixExistingChallenges() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔒 SECURITY FIX: Adding whopCompanyId to existing challenges\n');
    
    // Get all challenges without whopCompanyId
    const challengesWithoutCompanyId = await prisma.challenge.findMany({
      where: {
        whopCompanyId: null
      },
      include: {
        tenant: true
      }
    });
    
    console.log(`Found ${challengesWithoutCompanyId.length} challenges without whopCompanyId\n`);
    
    for (const challenge of challengesWithoutCompanyId) {
      const tenantCompanyId = challenge.tenant?.whopCompanyId;
      
      if (tenantCompanyId) {
        console.log(`🔧 Fixing Challenge: "${challenge.title}"`);
        console.log(`   Challenge ID: ${challenge.id}`);
        console.log(`   Tenant Company ID: ${tenantCompanyId}`);
        
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: { whopCompanyId: tenantCompanyId }
        });
        
        console.log(`   ✅ Updated whopCompanyId to: ${tenantCompanyId}\n`);
      } else {
        console.log(`❌ Challenge "${challenge.title}" has no tenant company ID - manual review needed\n`);
      }
    }
    
    // Verify fix
    console.log('🔍 VERIFICATION: Checking all challenges now have whopCompanyId...\n');
    
    const allChallenges = await prisma.challenge.findMany({
      include: {
        tenant: true
      }
    });
    
    let fixedCount = 0;
    let problemCount = 0;
    
    allChallenges.forEach(challenge => {
      const hasCompanyId = !!challenge.whopCompanyId;
      const matchesTenant = challenge.whopCompanyId === challenge.tenant?.whopCompanyId;
      
      console.log(`📋 Challenge: "${challenge.title}"`);
      console.log(`   whopCompanyId: ${challenge.whopCompanyId || 'NULL'}`);
      console.log(`   tenant.whopCompanyId: ${challenge.tenant?.whopCompanyId || 'NULL'}`);
      
      if (hasCompanyId && matchesTenant) {
        console.log(`   ✅ Security OK`);
        fixedCount++;
      } else {
        console.log(`   ❌ Security ISSUE`);
        problemCount++;
      }
      console.log();
    });
    
    console.log('📊 SECURITY SUMMARY:');
    console.log(`✅ Secure challenges: ${fixedCount}`);
    console.log(`❌ Problematic challenges: ${problemCount}`);
    console.log(`📋 Total challenges: ${allChallenges.length}`);
    
    if (problemCount === 0) {
      console.log('\n🎉 ALL CHALLENGES NOW HAVE PROPER COMPANY ISOLATION!');
    } else {
      console.log('\n⚠️  Some challenges still need manual review');
    }
    
  } catch (error) {
    console.error('Error fixing challenges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingChallenges();