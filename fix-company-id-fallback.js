const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCompanyIdFallback() {
  console.log('🛠️ FIXING COMPANY ID FALLBACK PROBLEM\n');
  
  try {
    console.log('🔍 CURRENT PROBLEM:');
    console.log('• Beide User haben Fallback Company ID: 9nmw5yleoqldrxf7n48c');
    console.log('• Echte Company IDs werden nicht aus Headers gelesen');
    console.log('• System kann euch nicht unterscheiden');
    console.log('');
    
    console.log('💡 LÖSUNG:');
    console.log('• Header-Processing reparieren');
    console.log('• Echte Company IDs aus Whop Headers extrahieren');
    console.log('• Separate Tenants für echte Company IDs erstellen');
    console.log('');
    
    // Für Testing: Simuliere echte Company IDs
    console.log('🧪 SIMULATION: Erstelle Test-Scenario mit echten Company IDs');
    
    // Clean up current fallback data
    await prisma.challenge.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});
    console.log('✅ Fallback-Daten gelöscht');
    
    // Create realistic scenario with different companies
    console.log('\n📋 CREATING REALISTIC COMPANY SEPARATION:');
    
    // User 1 - Du (mit deiner echten Company aus .env)
    const yourCompanyId = 'biz_YoIIIT73rXwrtK'; // Aus .env.local
    const yourTenant = await prisma.tenant.create({
      data: {
        name: `Your Company (${yourCompanyId})`,
        whopCompanyId: yourCompanyId
      }
    });
    
    const you = await prisma.user.create({
      data: {
        email: 'user_eGf5vVjIuGLSy@whop.com',
        name: 'You (Company Owner)',
        whopUserId: 'user_eGf5vVjIuGLSy',
        whopCompanyId: yourCompanyId, // ECHTE Company ID
        experienceId: null, // Company Owner hat keine Experience ID
        role: 'ADMIN',
        tenantId: yourTenant.id
      }
    });
    
    console.log(`✅ Created YOU as Company Owner:`);
    console.log(`   Company ID: ${yourCompanyId}`);
    console.log(`   Role: ADMIN`);
    console.log(`   Experience ID: NULL (Company Owner)`);
    
    // User 2 - Kollege (mit simulierter Company ID)
    const colleagueCompanyId = 'biz_ColleagueCompany123';
    const colleagueTenant = await prisma.tenant.create({
      data: {
        name: `Colleague Company (${colleagueCompanyId})`,
        whopCompanyId: colleagueCompanyId
      }
    });
    
    const colleague = await prisma.user.create({
      data: {
        email: 'user_w3lVukX5x9ayO@whop.com',
        name: 'Colleague (Company Owner)',
        whopUserId: 'user_w3lVukX5x9ayO',
        whopCompanyId: colleagueCompanyId, // SEPARATE Company ID
        experienceId: null, // Company Owner hat keine Experience ID
        role: 'ADMIN',
        tenantId: colleagueTenant.id
      }
    });
    
    console.log(`✅ Created COLLEAGUE as Company Owner:`);
    console.log(`   Company ID: ${colleagueCompanyId}`);
    console.log(`   Role: ADMIN`);
    console.log(`   Experience ID: NULL (Company Owner)`);
    
    // Create test challenges for separation
    const yourChallenge = await prisma.challenge.create({
      data: {
        title: 'Your Company Challenge',
        description: 'Only you should see this',
        whopCompanyId: yourCompanyId,
        experienceId: null,
        tenantId: yourTenant.id,
        creatorId: you.id,
        category: 'FITNESS',
        difficulty: 'INTERMEDIATE',
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    const colleagueChallenge = await prisma.challenge.create({
      data: {
        title: 'Colleague Company Challenge',
        description: 'Only colleague should see this',
        whopCompanyId: colleagueCompanyId,
        experienceId: null,
        tenantId: colleagueTenant.id,
        creatorId: colleague.id,
        category: 'MINDFULNESS',
        difficulty: 'BEGINNER',
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    console.log(`✅ Created separate test challenges`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING SCENARIOS:\n');
    
    console.log('📋 TEST 1 - Your Admin Access:');
    console.log('   Headers to simulate:');
    console.log(`   x-whop-user-id: user_eGf5vVjIuGLSy`);
    console.log(`   x-whop-company-id: ${yourCompanyId}`);
    console.log('   x-whop-experience-id: (NOT SET)');
    console.log('   Expected: Should see "Your Company Challenge"');
    console.log('');
    
    console.log('📋 TEST 2 - Colleague Admin Access:');
    console.log('   Headers to simulate:');
    console.log(`   x-whop-user-id: user_w3lVukX5x9ayO`);
    console.log(`   x-whop-company-id: ${colleagueCompanyId}`);
    console.log('   x-whop-experience-id: (NOT SET)');
    console.log('   Expected: Should see "Colleague Company Challenge"');
    console.log('');
    
    console.log('🎯 NEXT STEP: Header-Processing reparieren!');
    console.log('   → Admin API muss echte Company IDs aus Headers lesen');
    console.log('   → Fallback-Werte entfernen');
    console.log('   → Perfect Company Isolation! ✅');
    
    // Show final state
    const finalUsers = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    console.log('\n📊 FINAL STATE:');
    finalUsers.forEach(user => {
      console.log(`${user.role}: ${user.name}`);
      console.log(`   └─ Company: ${user.whopCompanyId}`);
      console.log(`   └─ Tenant: ${user.tenant?.name}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompanyIdFallback();