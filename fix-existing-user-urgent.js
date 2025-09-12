// URGENT: Fix existing user with fallback company ID
const { PrismaClient } = require('@prisma/client');

async function fixExistingUser() {
  console.log('🚨 URGENT: FIXING EXISTING USER WITH FALLBACK COMPANY ID\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Find the user with fallback company ID and experience ID
    const userToFix = await prisma.user.findFirst({
      where: { 
        whopCompanyId: '9nmw5yleoqldrxf7n48c',
        experienceId: { not: null }
      },
      include: { tenant: true }
    });
    
    if (userToFix) {
      console.log('👤 FOUND USER TO FIX:');
      console.log(`   Email: ${userToFix.email}`);
      console.log(`   Experience ID: ${userToFix.experienceId}`);
      console.log(`   Current Company ID: ${userToFix.whopCompanyId}`);
      console.log(`   Current Role: ${userToFix.role}`);
      
      // Extract real company ID from experience ID
      const realCompanyId = `biz_${userToFix.experienceId.replace('exp_', '')}`;
      
      console.log(`\n🎯 FIXING USER:`);
      console.log(`   Real Company ID: ${realCompanyId}`);
      
      // Check if we need to create a new tenant for this company
      let tenant = await prisma.tenant.findUnique({
        where: { whopCompanyId: realCompanyId }
      });
      
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: `Experience ${userToFix.experienceId.replace('exp_', '')}`,
            whopCompanyId: realCompanyId,
            whopHandle: `exp-${userToFix.experienceId.replace('exp_', '')}`,
            whopProductId: `prod_${userToFix.experienceId.replace('exp_', '')}`
          }
        });
        console.log(`✅ Created new tenant: ${tenant.name}`);
      }
      
      // Determine if user should be admin (experience owner)
      const isExperienceOwner = true; // If they have an experience ID, they own it
      const newRole = isExperienceOwner ? 'ADMIN' : 'USER';
      
      // Update user with real company ID and correct role
      const updatedUser = await prisma.user.update({
        where: { id: userToFix.id },
        data: {
          whopCompanyId: realCompanyId,
          role: newRole,
          tenantId: tenant.id
        }
      });
      
      console.log(`\n✅ USER FIXED:`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   New Company ID: ${updatedUser.whopCompanyId}`);
      console.log(`   New Role: ${updatedUser.role}`);
      console.log(`   Tenant: ${tenant.name}`);
      
      console.log(`\n🎉 SUCCESS: User now has their own company and admin access!`);
      
    } else {
      console.log('ℹ️ No users found with fallback company ID and experience ID');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingUser().catch(console.error);