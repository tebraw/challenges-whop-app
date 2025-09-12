// fix-user-company-separation.js
// Emergency fix: Separate all users into their own individual companies

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserCompanySeparation() {
  console.log('🚨 EMERGENCY FIX: Separating all users into individual companies...\n');

  try {
    // Get all users that need separation
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Found ${users.length} users to process:\n`);

    for (const user of users) {
      console.log(`👤 Processing user: ${user.email} (${user.whopUserId})`);
      
      // Create unique company ID for this user
      const uniqueCompanyId = `user_company_${user.whopUserId}`;
      const companyName = `${user.name || user.email.split('@')[0]}'s Company`;
      
      console.log(`   🏢 Creating company: ${companyName} (${uniqueCompanyId})`);
      
      // Check if tenant already exists for this company
      let tenant = await prisma.tenant.findUnique({
        where: { whopCompanyId: uniqueCompanyId }
      });
      
      if (!tenant) {
        // Create new tenant for this user
        tenant = await prisma.tenant.create({
          data: {
            name: companyName,
            whopCompanyId: uniqueCompanyId
          }
        });
        console.log(`   ✅ Created new tenant: ${tenant.name}`);
      } else {
        console.log(`   ♻️  Using existing tenant: ${tenant.name}`);
      }
      
      // Update user to use their own company
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          tenantId: tenant.id,
          whopCompanyId: uniqueCompanyId
        }
      });
      
      console.log(`   ✅ Updated user ${user.email} → Company: ${uniqueCompanyId}\n`);
    }

    // Migrate existing challenges to correct companies
    console.log('🔄 Migrating existing challenges...\n');
    
    const challenges = await prisma.challenge.findMany({
      include: {
        creator: true
      }
    });
    
    for (const challenge of challenges) {
      if (challenge.creator && challenge.creator.whopCompanyId) {
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: {
            whopCompanyId: challenge.creator.whopCompanyId
          }
        });
        
        console.log(`✅ Challenge "${challenge.title}" → Company: ${challenge.creator.whopCompanyId}`);
      }
    }

    // Verification: Check final state
    console.log('\n🔍 VERIFICATION - Final state:');
    
    const finalUsers = await prisma.user.findMany({
      include: {
        tenant: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    finalUsers.forEach(user => {
      console.log(`✅ ${user.email} → Company: ${user.whopCompanyId} → Tenant: ${user.tenant?.name}`);
    });

    console.log('\n🎉 SUCCESS: All users now have individual companies!');
    console.log('Each user will only see their own challenges.');

  } catch (error) {
    console.error('❌ Error during user separation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserCompanySeparation();