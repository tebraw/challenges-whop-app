// debug-colleague-access-new.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugColleagueAccess() {
  try {
    console.log('🔍 DEBUGGING COLLEAGUE ACCESS');
    console.log('================================');
    
    const companyId = '9nmw5yleoqldrxf7n48c';
    const experienceId = 'exp_FfvW58A4GdsOMM';
    
    // 1. Find user in database
    const user = await prisma.user.findFirst({
      where: {
        whopCompanyId: companyId
      }
    });
    
    console.log('1. USER IN DATABASE:');
    if (user) {
      console.log(`   ✅ Found: ${user.email}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Whop User ID: ${user.whopUserId}`);
      console.log(`   🏢 Company ID: ${user.whopCompanyId}`);
      console.log(`   🎭 Role: ${user.role}`);
      console.log(`   📱 Experience ID: ${user.experienceId}`);
      console.log(`   🔄 Subscription Status: ${user.subscriptionStatus}`);
      console.log(`   🎯 Tier: ${user.tier}`);
    } else {
      console.log('   ❌ No user found with this company ID');
    }
    
    console.log('\n2. CHECKING WHOP MEMBERSHIPS:');
    
    if (user?.whopUserId) {
      // Simulate what hasActiveSubscription() would check
      console.log('   🔍 Checking Access Pass subscriptions...');
      
      // These are our Access Pass product IDs
      const basicProductId = 'prod_YByUE3J5oT4Fq';
      const proProductId = 'prod_Tj4T1U7pVwtgb';
      
      console.log(`   📦 Looking for Basic Access Pass: ${basicProductId}`);
      console.log(`   📦 Looking for Pro Access Pass: ${proProductId}`);
      
      // Note: We can't actually call Whop API from this script without proper headers
      // But we can see what the logic should find
    }
    
    console.log('\n3. ROLE DETERMINATION LOGIC:');
    console.log('   For ADMIN role, user needs:');
    console.log('   ✓ Company ownership (has company ID)');
    console.log('   ✓ Active Access Pass subscription');
    
    if (user) {
      const hasCompanyId = !!user.whopCompanyId;
      console.log(`   Company ID present: ${hasCompanyId ? '✅' : '❌'} (${user.whopCompanyId})`);
      console.log(`   Current role: ${user.role}`);
      
      if (user.role === 'USER' && hasCompanyId) {
        console.log('   🤔 User has company ID but role is USER');
        console.log('   💡 This suggests subscription check is failing');
        console.log('   📋 Need to verify:');
        console.log('      1. User has active Basic or Pro Access Pass');
        console.log('      2. getUserRole() function is being called');
        console.log('      3. Whop API returns correct membership data');
      }
    }
    
    console.log('\n4. RECOMMENDED ACTIONS:');
    console.log('   1. Check if user has purchased Access Pass in Whop dashboard');
    console.log('   2. Verify membership status is "active" and "valid: true"');
    console.log('   3. Test getUserRole() function with this user\'s data');
    console.log('   4. Check middleware logs when user accesses admin routes');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugColleagueAccess();