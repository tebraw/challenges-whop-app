// Check latest user with fallback company ID
const { PrismaClient } = require('@prisma/client');

async function checkLatestUser() {
  console.log('🔍 CHECKING LATEST USER WITH FALLBACK COMPANY ID...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Find latest user
    const latestUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { tenant: true }
    });
    
    if (latestUser) {
      console.log('👤 LATEST USER:');
      console.log(`   Email: ${latestUser.email}`);
      console.log(`   Whop User ID: ${latestUser.whopUserId}`);
      console.log(`   Company ID: ${latestUser.whopCompanyId}`);
      console.log(`   Role: ${latestUser.role}`);
      console.log(`   Experience ID: ${latestUser.experienceId || 'NONE'}`);
      console.log(`   Created: ${latestUser.createdAt}`);
      console.log(`   Tenant: ${latestUser.tenant?.name || 'NO TENANT'}`);
      
      if (latestUser.whopCompanyId === '9nmw5yleoqldrxf7n48c') {
        console.log('   🚨 FALLBACK COMPANY ID DETECTED!');
        
        // Check if this is your colleague
        if (latestUser.whopUserId) {
          console.log(`\n🔍 ANALYZING WHERE THIS USER WAS CREATED:`);
          console.log(`   User ID: ${latestUser.whopUserId}`);
          
          if (latestUser.experienceId) {
            console.log(`   Has Experience ID: ${latestUser.experienceId}`);
            console.log(`   Should have Company ID: biz_${latestUser.experienceId.replace('exp_', '')}`);
            console.log(`   ❌ BUT HAS FALLBACK: 9nmw5yleoqldrxf7n48c`);
          } else {
            console.log(`   NO Experience ID - might be company owner`);
          }
        }
      } else {
        console.log('   ✅ Real company ID');
      }
    }
    
    // Check all users with fallback
    console.log('\n🔍 ALL USERS WITH FALLBACK COMPANY ID:');
    const fallbackUsers = await prisma.user.findMany({
      where: { whopCompanyId: '9nmw5yleoqldrxf7n48c' },
      include: { tenant: true },
      orderBy: { createdAt: 'desc' }
    });
    
    if (fallbackUsers.length === 0) {
      console.log('   ✅ NO FALLBACK USERS FOUND!');
    } else {
      console.log(`   ❌ ${fallbackUsers.length} users with fallback company ID:`);
      fallbackUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} (${user.role}) - Created: ${user.createdAt}`);
        console.log(`      Whop User ID: ${user.whopUserId}`);
        console.log(`      Experience ID: ${user.experienceId || 'NONE'}`);
        console.log(`      Tenant: ${user.tenant?.name || 'NO TENANT'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestUser().catch(console.error);