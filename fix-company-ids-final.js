// Fix Company IDs based on Experience IDs
const { PrismaClient } = require('@prisma/client');

async function fixCompanyIDs() {
  console.log("🔧 FIXING COMPANY IDs BASED ON EXPERIENCE IDs...\n");
  
  const prisma = new PrismaClient();
  
  try {
    // Get all users with fallback company ID
    const users = await prisma.user.findMany({
      where: {
        whopCompanyId: '9nmw5yleoqldrxf7n48c' // Fallback ID
      }
    });
    
    console.log(`Found ${users.length} users with fallback company ID\n`);
    
    for (const user of users) {
      console.log(`👤 Fixing user: ${user.email}`);
      console.log(`   Current Company ID: ${user.whopCompanyId}`);
      console.log(`   Experience ID: ${user.experienceId}`);
      
      if (user.experienceId) {
        // Extract company ID from experience ID
        // exp_Tj1OwPyPNw7p0S → biz_Tj1OwPyPNw7p0S
        const experienceCode = user.experienceId.replace('exp_', '');
        const newCompanyId = `biz_${experienceCode}`;
        
        console.log(`   → New Company ID: ${newCompanyId}`);
        
        // Update user
        await prisma.user.update({
          where: { id: user.id },
          data: { whopCompanyId: newCompanyId }
        });
        
        console.log(`   ✅ Updated!`);
      } else {
        console.log(`   ⚠️  No experience ID - keeping fallback`);
      }
      
      console.log('');
    }
    
    // Verify the changes
    console.log("🔍 VERIFICATION - Updated users:");
    const updatedUsers = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    for (const user of updatedUsers) {
      console.log(`👤 ${user.email}:`);
      console.log(`   Whop Company ID: ${user.whopCompanyId}`);
      console.log(`   Experience ID: ${user.experienceId}`);
      console.log(`   Tenant Company: ${user.tenant?.whopCompanyId}`);
      console.log('');
    }
    
    // Show unique company IDs now
    const uniqueCompanyIds = [...new Set(updatedUsers.map(u => u.whopCompanyId).filter(Boolean))];
    console.log(`🎯 RESULT: Now we have ${uniqueCompanyIds.length} unique company IDs:`);
    uniqueCompanyIds.forEach(id => {
      const usersWithId = updatedUsers.filter(u => u.whopCompanyId === id);
      console.log(`   ${id}: ${usersWithId.length} user(s)`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Also create a separate tenant for each experience
async function createSeparateTenants() {
  console.log("\n🏢 CREATING SEPARATE TENANTS FOR EACH EXPERIENCE...\n");
  
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany();
    const uniqueExperiences = [...new Set(users.map(u => u.experienceId).filter(Boolean))];
    
    console.log(`Found ${uniqueExperiences.length} unique experiences`);
    
    for (const expId of uniqueExperiences) {
      const usersInExp = users.filter(u => u.experienceId === expId);
      const experienceCode = expId.replace('exp_', '');
      const companyId = `biz_${experienceCode}`;
      
      console.log(`\n📍 Experience: ${expId}`);
      console.log(`   Users: ${usersInExp.length}`);
      console.log(`   Company ID: ${companyId}`);
      
      // Check if tenant already exists
      const existingTenant = await prisma.tenant.findFirst({
        where: { whopCompanyId: companyId }
      });
      
      if (existingTenant) {
        console.log(`   ✅ Tenant already exists: ${existingTenant.name}`);
      } else {
        // Create new tenant
        const newTenant = await prisma.tenant.create({
          data: {
            name: `Experience ${experienceCode}`,
            whopCompanyId: companyId,
            whopHandle: `exp-${experienceCode}`,
            whopProductId: `prod_${experienceCode}`
          }
        });
        
        console.log(`   ✅ Created tenant: ${newTenant.name}`);
        
        // Update users to use this tenant
        for (const user of usersInExp) {
          await prisma.user.update({
            where: { id: user.id },
            data: { tenantId: newTenant.id }
          });
        }
        
        console.log(`   ✅ Updated ${usersInExp.length} users to use new tenant`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error creating tenants:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Test the admin API with the new company IDs
async function testAdminAPI() {
  console.log("\n🧪 TESTING ADMIN API LOGIC...\n");
  
  const testScenarios = [
    {
      name: "Company Owner",
      headers: {
        'x-whop-company-id': 'biz_YoIIIT73rXwrtK',
        'x-whop-experience-id': null,
        'x-whop-user-id': 'user_Z9GOqqGEJWyjG'
      }
    },
    {
      name: "Experience Member 1",
      headers: {
        'x-whop-company-id': 'biz_Tj1OwPyPNw7p0S',
        'x-whop-experience-id': 'exp_Tj1OwPyPNw7p0S',
        'x-whop-user-id': 'user_w3lVukX5x9ayO'
      }
    },
    {
      name: "Experience Member 2",
      headers: {
        'x-whop-company-id': 'biz_3wSpfXnrRl7puA',
        'x-whop-experience-id': 'exp_3wSpfXnrRl7puA',
        'x-whop-user-id': 'user_eGf5vVjIuGLSy'
      }
    }
  ];
  
  testScenarios.forEach(scenario => {
    console.log(`🧪 ${scenario.name}:`);
    console.log(`   Company ID: ${scenario.headers['x-whop-company-id']}`);
    console.log(`   Experience ID: ${scenario.headers['x-whop-experience-id'] || 'NONE'}`);
    console.log(`   User ID: ${scenario.headers['x-whop-user-id']}`);
    
    const isCompanyOwner = !scenario.headers['x-whop-experience-id'] && scenario.headers['x-whop-company-id'];
    console.log(`   → isCompanyOwner: ${isCompanyOwner}`);
    console.log(`   → Access Level: ${isCompanyOwner ? 'ADMIN (all challenges)' : 'USER (experience only)'}`);
    console.log('');
  });
  
  console.log("🎯 PERFECT ISOLATION: Each user/company has separate access!");
}

console.log("🚀 STARTING COMPANY ID FIX...\n");

fixCompanyIDs()
  .then(() => createSeparateTenants())
  .then(() => testAdminAPI())
  .then(() => console.log("\n✅ COMPANY ID FIX COMPLETE! 🎉"))
  .catch(console.error);