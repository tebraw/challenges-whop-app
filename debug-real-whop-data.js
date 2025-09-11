/**
 * 🔍 DEBUG ECHTE WHOP API DATEN
 * 
 * Analysiert welche echten Daten von Whop API kommen
 */

const { PrismaClient } = require('@prisma/client');

async function debugRealWhopData() {
  console.log('🔍 Debugging echte Whop API Daten...\n');

  try {
    // 1. Schaue was aktuell in der Datenbank ist
    const prisma = new PrismaClient();
    
    console.log('📋 AKTUELLE DATENBANK DATEN:');
    const tenants = await prisma.tenant.findMany({
      include: {
        users: true
      }
    });

    tenants.forEach((tenant, index) => {
      console.log(`\n${index + 1}. TENANT:`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Name: ${tenant.name}`);
      console.log(`   Whop Company ID: ${tenant.whopCompanyId}`);
      console.log(`   Whop Handle: ${tenant.whopHandle}`);
      console.log(`   Whop Product ID: ${tenant.whopProductId}`);
      console.log(`   Created: ${tenant.createdAt}`);
      
      if (tenant.users.length > 0) {
        console.log(`   USERS:`);
        tenant.users.forEach(user => {
          console.log(`     - ${user.name} (${user.email})`);
          console.log(`       Whop User ID: ${user.whopUserId}`);
          console.log(`       Whop Company ID: ${user.whopCompanyId}`);
          console.log(`       Role: ${user.role}`);
        });
      }
    });

    // 2. Simuliere was der Auth-Flow macht
    console.log('\n' + '='.repeat(60));
    console.log('🔍 WAS PASSIERT BEI APP INSTALLATION:\n');
    
    console.log('1. User installiert App über Whop');
    console.log('2. Whop redirected zu unserem /api/auth/whop/callback');
    console.log('3. Wir bekommen Session mit:');
    console.log('   - session.userId (Whop User ID)');
    console.log('   - session.email');
    console.log('   - session.username');
    console.log('   - session.companyId (falls Company Owner)');
    
    console.log('\n4. Wir machen API Call zu:');
    console.log('   GET /v5/users/{userId}/companies');
    console.log('   → Gibt uns Array von Companies zurück');
    
    console.log('\n5. Für jede Company erstellen wir Tenant mit:');
    console.log('   - company.id → whopCompanyId');
    console.log('   - company.name → tenant.name');
    console.log('   - company.handle → whopHandle (HIER IST DAS PROBLEM!)');

    console.log('\n❓ FRAGE: Was steht wirklich in company.handle?');
    console.log('❓ FRAGE: Haben alle Companies einen handle?');
    console.log('❓ FRAGE: Wie bekommen wir Product IDs?');

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugRealWhopData();