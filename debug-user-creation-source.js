// Debug: Find where the user was created
const { PrismaClient } = require('@prisma/client');

async function debugUserCreation() {
  console.log('🔍 DEBUGGING: Where was the fallback user created?\n');
  
  const prisma = new PrismaClient();
  
  try {
    const fallbackUser = await prisma.user.findFirst({
      where: { whopCompanyId: '9nmw5yleoqldrxf7n48c' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (fallbackUser) {
      console.log('👤 FALLBACK USER DETAILS:');
      console.log(`   Email: ${fallbackUser.email}`);
      console.log(`   Experience ID: ${fallbackUser.experienceId}`);
      console.log(`   Company ID: ${fallbackUser.whopCompanyId} (FALLBACK!)`);
      console.log(`   Created: ${fallbackUser.createdAt}`);
      console.log(`   Whop User ID: ${fallbackUser.whopUserId}`);
      
      console.log('\n🔍 ANALYSIS:');
      if (fallbackUser.experienceId) {
        const correctCompanyId = `biz_${fallbackUser.experienceId.replace('exp_', '')}`;
        console.log(`   Has Experience ID: ${fallbackUser.experienceId}`);
        console.log(`   Should have Company ID: ${correctCompanyId}`);
        console.log(`   ❌ But has: ${fallbackUser.whopCompanyId}`);
        
        console.log('\n🤔 POSSIBLE REASONS:');
        console.log('   1. User was created BEFORE our fix was deployed');
        console.log('   2. User was created by a different code path');
        console.log('   3. There is still a fallback somewhere we missed');
        
      } else {
        console.log('   ❌ No Experience ID - this should not happen!');
      }
      
      console.log('\n📊 TIMING ANALYSIS:');
      const now = new Date();
      const created = new Date(fallbackUser.createdAt);
      const minutesAgo = Math.floor((now - created) / (1000 * 60));
      console.log(`   Created ${minutesAgo} minutes ago`);
      console.log(`   Our fixes were made ~${minutesAgo > 30 ? 'BEFORE' : 'AFTER'} this user was created`);
    }
    
    // Check all auth-related files for fallback company IDs
    console.log('\n🔍 SEARCHING FOR REMAINING FALLBACK SOURCES...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserCreation().catch(console.error);