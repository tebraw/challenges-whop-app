const { PrismaClient } = require('@prisma/client');

async function analyzeDatabaseState() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Analyzing current database state...\n');
    
    // Check all tenants
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('🏢 TENANTS in database:');
    console.log('========================');
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. Tenant ID: ${tenant.id}`);
      console.log(`   Name: "${tenant.name}"`);
      console.log(`   Whop Company ID: "${tenant.whopCompanyId}"`);
      console.log(`   Created: ${tenant.createdAt}`);
      console.log(`   Updated: ${tenant.updatedAt}`);
      console.log('');
    });
    
    // Check all users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('👤 USERS in database:');
    console.log('=====================');
    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Whop User ID: "${user.whopUserId}"`);
      console.log(`   Experience ID: "${user.experienceId}"`);
      console.log(`   Company ID: "${user.companyId || 'null'}"`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Is Admin: ${user.isAdmin}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Check challenges
    const challenges = await prisma.challenge.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('🎯 CHALLENGES in database:');
    console.log('==========================');
    if (challenges.length === 0) {
      console.log('No challenges found.');
    } else {
      challenges.forEach((challenge, index) => {
        console.log(`${index + 1}. Challenge ID: ${challenge.id}`);
        console.log(`   Title: "${challenge.title}"`);
        console.log(`   Experience ID: "${challenge.experienceId}"`);
        console.log(`   Tenant ID: ${challenge.tenantId}`);
        console.log(`   Creator ID: ${challenge.creatorId || 'null'}`);
        console.log(`   Created: ${challenge.createdAt}`);
        console.log('');
      });
    }
    
    // Analysis
    console.log('📊 ANALYSIS:');
    console.log('============');
    console.log(`Total Tenants: ${tenants.length}`);
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Challenges: ${challenges.length}`);
    
    // Check for fallback company usage
    const fallbackTenants = tenants.filter(t => 
      t.whopCompanyId === 'biz_fallback_company_id' || 
      t.whopCompanyId.includes('fallback') ||
      t.name.includes('Fallback')
    );
    
    if (fallbackTenants.length > 0) {
      console.log('\n⚠️  FALLBACK COMPANY USAGE DETECTED:');
      fallbackTenants.forEach(tenant => {
        console.log(`   - Tenant "${tenant.name}" uses Company ID: "${tenant.whopCompanyId}"`);
      });
    }
    
    // Check for real company IDs
    const realCompanyTenants = tenants.filter(t => 
      t.whopCompanyId.startsWith('biz_') && 
      !t.whopCompanyId.includes('fallback') &&
      t.whopCompanyId !== 'biz_fallback_company_id'
    );
    
    if (realCompanyTenants.length > 0) {
      console.log('\n✅ REAL COMPANY IDs DETECTED:');
      realCompanyTenants.forEach(tenant => {
        console.log(`   - Tenant "${tenant.name}" uses Company ID: "${tenant.whopCompanyId}"`);
      });
    }
    
    // Check for experience IDs
    const experienceTenants = tenants.filter(t => 
      t.whopCompanyId.startsWith('exp_')
    );
    
    if (experienceTenants.length > 0) {
      console.log('\n🎭 EXPERIENCE IDs DETECTED:');
      experienceTenants.forEach(tenant => {
        console.log(`   - Tenant "${tenant.name}" uses Experience ID: "${tenant.whopCompanyId}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDatabaseState();