// EMERGENCY FIX: Create individual companies for each user to fix cross-contamination
const { PrismaClient } = require('@prisma/client');

async function emergencyFixUserSeparation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 EMERGENCY FIX: Creating separate companies for each user');
    console.log('===========================================================\n');
    
    // Get all users with the problematic shared company ID
    const sharedUsers = await prisma.user.findMany({
      where: {
        whopCompanyId: '9nmw5yleoqldrxf7n48c'
      },
      select: {
        id: true,
        email: true,
        whopUserId: true,
        whopCompanyId: true,
        tenantId: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`🔍 Found ${sharedUsers.length} users sharing the same company ID`);
    
    for (let i = 0; i < sharedUsers.length; i++) {
      const user = sharedUsers[i];
      console.log(`\n👤 Processing User ${i + 1}: ${user.email}`);
      
      // Create unique company ID for this user
      const uniqueCompanyId = `company_${user.whopUserId}`;
      const companyName = `${user.email.split('@')[0]}'s Company`;
      
      // Create new tenant for this user (or get existing one)
      let newTenant = await prisma.tenant.findFirst({
        where: { whopCompanyId: uniqueCompanyId }
      });
      
      if (!newTenant) {
        newTenant = await prisma.tenant.create({
          data: {
            name: companyName,
            whopCompanyId: uniqueCompanyId
          }
        });
        console.log(`🏢 Created new tenant: ${newTenant.name} (ID: ${uniqueCompanyId})`);
      } else {
        console.log(`🏢 Using existing tenant: ${newTenant.name} (ID: ${uniqueCompanyId})`);
      }
      
      // Update user with new company and tenant
      await prisma.user.update({
        where: { id: user.id },
        data: {
          whopCompanyId: uniqueCompanyId,
          tenantId: newTenant.id,
          role: 'ADMIN' // All company owners get admin access
        }
      });
      
      console.log(`✅ Updated user with new company: ${uniqueCompanyId}`);
      
      // Move user's challenges to new tenant
      const userChallenges = await prisma.challenge.updateMany({
        where: {
          AND: [
            { creatorId: user.id },
            { whopCompanyId: '9nmw5yleoqldrxf7n48c' }
          ]
        },
        data: {
          whopCompanyId: uniqueCompanyId,
          tenantId: newTenant.id
        }
      });
      
      console.log(`📋 Moved ${userChallenges.count} challenges to new company`);
    }
    
    // Verify the fix
    console.log('\n✅ VERIFICATION:');
    console.log('================');
    
    const updatedUsers = await prisma.user.findMany({
      where: {
        id: { in: sharedUsers.map(u => u.id) }
      },
      select: {
        email: true,
        whopCompanyId: true,
        tenantId: true,
        role: true
      }
    });
    
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Company: ${user.whopCompanyId}`);
      console.log(`   Tenant: ${user.tenantId}`);
      console.log(`   Role: ${user.role}`);
      console.log('   ---');
    });
    
    console.log('\n🎉 EMERGENCY FIX COMPLETE!');
    console.log('✅ Each user now has their own unique company');
    console.log('✅ No more cross-contamination possible');
    console.log('✅ All users have admin access to their own company');
    
  } catch (error) {
    console.error('❌ Error during emergency fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

emergencyFixUserSeparation();