const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixExistingFallbackUser() {
  console.log('🔧 FIXING: Converting fallback user to correct company ID\n');

  try {
    // Find the user with fallback company ID
    const fallbackUser = await prisma.user.findFirst({
      where: { 
        whopCompanyId: '9nmw5yleoqldrxf7n48c',
        experienceId: 'exp_uRE7hn9FdTpuUI'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!fallbackUser) {
      console.log('❌ No fallback user found with experience ID exp_uRE7hn9FdTpuUI');
      return;
    }

    console.log('📋 FOUND FALLBACK USER:');
    console.log('   ID:', fallbackUser.id);
    console.log('   Email:', fallbackUser.email);
    console.log('   Current Company ID:', fallbackUser.whopCompanyId);
    console.log('   Experience ID:', fallbackUser.experienceId);
    console.log('   Role:', fallbackUser.role);
    console.log();

    // Extract correct company ID from experience ID
    const correctCompanyId = `biz_${fallbackUser.experienceId?.replace('exp_', '') || 'uRE7hn9FdTpuUI'}`;
    
    console.log('🎯 CONVERSION:');
    console.log('   Experience ID:', fallbackUser.experienceId);
    console.log('   Correct Company ID:', correctCompanyId);
    console.log();

    // Check if we need to create a tenant for the correct company ID
    let tenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: correctCompanyId }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: `Company ${correctCompanyId.slice(-6)}`,
          whopCompanyId: correctCompanyId
        }
      });
      console.log(`🆕 Created tenant for company: ${correctCompanyId}`);
    } else {
      console.log(`✅ Tenant already exists for company: ${correctCompanyId}`);
    }

    // Update the user with correct company ID and tenant
    const updatedUser = await prisma.user.update({
      where: { id: fallbackUser.id },
      data: {
        whopCompanyId: correctCompanyId,
        tenantId: tenant.id,
        role: 'ADMIN' // Since this is the experience owner
      }
    });

    console.log('✅ UPDATED USER:');
    console.log('   ID:', updatedUser.id);
    console.log('   Email:', updatedUser.email);
    console.log('   New Company ID:', updatedUser.whopCompanyId);
    console.log('   New Tenant ID:', updatedUser.tenantId);
    console.log('   New Role:', updatedUser.role);
    console.log();

    console.log('🎉 SUCCESS: User updated with correct company ID!');
    console.log('🎯 Your colleague should now have proper access to your experience.');

  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingFallbackUser();