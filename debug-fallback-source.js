const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUserCreationFlow() {
  console.log('🔍 DEBUGGING: User creation flow for fallback company ID\n');

  try {
    // Get the latest user with fallback company ID
    const fallbackUser = await prisma.user.findFirst({
      where: { whopCompanyId: '9nmw5yleoqldrxf7n48c' },
      orderBy: { createdAt: 'desc' }
    });

    if (!fallbackUser) {
      console.log('❌ No fallback users found');
      return;
    }

    console.log('👤 LATEST FALLBACK USER:');
    console.log('   Email:', fallbackUser.email);
    console.log('   Experience ID:', fallbackUser.experienceId);
    console.log('   Company ID:', fallbackUser.whopCompanyId);
    console.log('   Created:', fallbackUser.createdAt);
    console.log('   Whop User ID:', fallbackUser.whopUserId);
    console.log();

    // Check the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: fallbackUser.tenantId }
    });

    console.log('🏢 ASSOCIATED TENANT:');
    console.log('   ID:', tenant?.id);
    console.log('   Name:', tenant?.name);
    console.log('   Whop Company ID:', tenant?.whopCompanyId);
    console.log();

    // Check if there are multiple tenants with the same fallback company ID
    const tenantsWithFallback = await prisma.tenant.findMany({
      where: { whopCompanyId: '9nmw5yleoqldrxf7n48c' }
    });

    console.log('🏢 ALL TENANTS WITH FALLBACK COMPANY ID:');
    tenantsWithFallback.forEach((t, index) => {
      console.log(`   ${index + 1}. ID: ${t.id}, Name: ${t.name}, Created: ${t.createdAt}`);
    });
    console.log();

    // THE KEY QUESTION: Where is this hardcoded value coming from?
    console.log('🚨 CRITICAL ANALYSIS:');
    console.log('   The value "9nmw5yleoqldrxf7n48c" is NOT in our environment variables.');
    console.log('   It must be hardcoded somewhere in the codebase.');
    console.log('   Or it could be coming from a database default/migration.');
    console.log();

    // Check if there are any environment variables being used
    console.log('🔧 ENVIRONMENT CHECK:');
    console.log('   NEXT_PUBLIC_WHOP_COMPANY_ID:', process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'NOT SET');
    console.log('   WHOP_COMPANY_ID:', process.env.WHOP_COMPANY_ID || 'NOT SET');
    console.log();

    // The most likely scenario: There's still a file with this hardcoded value
    // Or there's a database migration/default that sets this value
    console.log('💡 POSSIBLE SOURCES:');
    console.log('   1. A file still has this hardcoded value');
    console.log('   2. Database migration or default value');
    console.log('   3. Cached code (need to rebuild/redeploy)');
    console.log('   4. Different code path not covered by our fixes');

  } catch (error) {
    console.error('❌ Error debugging user creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserCreationFlow();