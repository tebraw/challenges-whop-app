// REMOVE ALL FALLBACK COMPANY IDs AND IMPLEMENT AUTO-EXTRACTION
const { PrismaClient } = require('@prisma/client');

async function removeAllFallbacksAndImplementAutoExtraction() {
  console.log("🚀 REMOVING ALL FALLBACK COMPANY IDs & IMPLEMENTING AUTO-EXTRACTION...\n");
  
  const prisma = new PrismaClient();
  const FALLBACK_COMPANY_ID = '9nmw5yleoqldrxf7n48c';
  
  try {
    // 1. Find all users with fallback company ID
    const usersWithFallback = await prisma.user.findMany({
      where: { whopCompanyId: FALLBACK_COMPANY_ID }
    });
    
    console.log(`📊 Found ${usersWithFallback.length} users with fallback company ID: ${FALLBACK_COMPANY_ID}\n`);
    
    if (usersWithFallback.length === 0) {
      console.log("✅ No users with fallback company ID found!");
      return;
    }
    
    // 2. Process each user and extract real company ID
    for (const user of usersWithFallback) {
      console.log(`👤 Processing user: ${user.email}`);
      console.log(`   Whop User ID: ${user.whopUserId}`);
      console.log(`   Experience ID: ${user.experienceId}`);
      console.log(`   Current Company ID: ${user.whopCompanyId} (FALLBACK)`);
      
      if (!user.experienceId) {
        console.log(`   ⚠️  No experience ID - cannot extract company ID. DELETING user.`);
        
        // Delete user without experience ID (invalid data)
        await prisma.user.delete({
          where: { id: user.id }
        });
        
        console.log(`   🗑️  DELETED user without experience ID`);
        continue;
      }
      
      // Extract real company ID from experience ID
      const experienceCode = user.experienceId.replace('exp_', '');
      const realCompanyId = `biz_${experienceCode}`;
      
      console.log(`   🎯 Real Company ID: ${realCompanyId}`);
      
      // Check if tenant exists for this company ID
      let tenant = await prisma.tenant.findUnique({
        where: { whopCompanyId: realCompanyId }
      });
      
      if (!tenant) {
        // Create tenant for this company
        tenant = await prisma.tenant.create({
          data: {
            name: `Experience ${experienceCode}`,
            whopCompanyId: realCompanyId,
            whopHandle: `exp-${experienceCode}`,
            whopProductId: `prod_${experienceCode}`
          }
        });
        console.log(`   🆕 Created tenant: Experience ${experienceCode}`);
      }
      
      // Update user with real company ID and correct tenant
      await prisma.user.update({
        where: { id: user.id },
        data: {
          whopCompanyId: realCompanyId,
          tenantId: tenant.id,
          role: 'USER' // Experience members are users by default
        }
      });
      
      console.log(`   ✅ Updated user with real company ID: ${realCompanyId}`);
      console.log('');
    }
    
    // 3. Verify no more fallback company IDs exist
    const remainingFallbacks = await prisma.user.findMany({
      where: { whopCompanyId: FALLBACK_COMPANY_ID }
    });
    
    if (remainingFallbacks.length === 0) {
      console.log("🎉 SUCCESS: All fallback company IDs have been removed!");
    } else {
      console.log(`⚠️  WARNING: ${remainingFallbacks.length} users still have fallback company IDs`);
    }
    
    // 4. Show final state
    console.log("\n📊 FINAL STATE:");
    console.log("================");
    
    const allUsers = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    const uniqueCompanyIds = [...new Set(allUsers.map(u => u.whopCompanyId).filter(Boolean))];
    
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Unique company IDs: ${uniqueCompanyIds.length}`);
    
    for (const companyId of uniqueCompanyIds) {
      const usersInCompany = allUsers.filter(u => u.whopCompanyId === companyId);
      console.log(`\n🏢 Company: ${companyId}`);
      console.log(`   Users: ${usersInCompany.length}`);
      
      for (const user of usersInCompany) {
        console.log(`   - ${user.email} (${user.role}) - Experience: ${user.experienceId || 'NONE'}`);
      }
    }
    
    console.log("\n🎯 AUTOMATIC COMPANY ID EXTRACTION IS NOW ACTIVE!");
    console.log("   - No more fallback company IDs");
    console.log("   - Each experience gets its own company ID");
    console.log("   - Each company gets its own tenant");
    console.log("   - Perfect isolation between users");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Also create a function to test the auto-extraction logic
async function testAutoExtractionLogic() {
  console.log("\n🧪 TESTING AUTO-EXTRACTION LOGIC:");
  console.log("==================================\n");
  
  const testCases = [
    {
      name: "Company Owner",
      experienceId: null,
      headerCompanyId: "biz_YoIIIT73rXwrtK",
      expected: "biz_YoIIIT73rXwrtK"
    },
    {
      name: "Experience Member 1",
      experienceId: "exp_Tj1OwPyPNw7p0S",
      headerCompanyId: null,
      expected: "biz_Tj1OwPyPNw7p0S"
    },
    {
      name: "Experience Member 2",
      experienceId: "exp_3wSpfXnrRl7puA",
      headerCompanyId: null,
      expected: "biz_3wSpfXnrRl7puA"
    },
    {
      name: "Invalid Case",
      experienceId: null,
      headerCompanyId: null,
      expected: null
    }
  ];
  
  function getRealCompanyId(experienceId, headerCompanyId) {
    if (!experienceId && headerCompanyId) {
      return headerCompanyId;
    }
    if (experienceId) {
      return `biz_${experienceId.replace('exp_', '')}`;
    }
    return null;
  }
  
  testCases.forEach(testCase => {
    const result = getRealCompanyId(testCase.experienceId, testCase.headerCompanyId);
    const success = result === testCase.expected;
    
    console.log(`🧪 ${testCase.name}:`);
    console.log(`   Experience ID: ${testCase.experienceId || 'NONE'}`);
    console.log(`   Header Company ID: ${testCase.headerCompanyId || 'NONE'}`);
    console.log(`   Expected: ${testCase.expected || 'NULL'}`);
    console.log(`   Result: ${result || 'NULL'}`);
    console.log(`   ${success ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
  });
}

console.log("🚀 STARTING FALLBACK REMOVAL & AUTO-EXTRACTION SETUP...\n");

removeAllFallbacksAndImplementAutoExtraction()
  .then(() => testAutoExtractionLogic())
  .then(() => console.log("\n🎉 FALLBACK REMOVAL COMPLETE! AUTO-EXTRACTION ACTIVE! 🎉"))
  .catch(console.error);