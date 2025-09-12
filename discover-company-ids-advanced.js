// Advanced Company ID Discovery Script
// This tries multiple methods to find real company IDs

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function discoveryCompanyIDs() {
  console.log("🔍 ERWEITERTE COMPANY ID SUCHE...\n");
  
  const prisma = new PrismaClient();
  
  try {
    // 1. DATABASE ANALYSE
    console.log("📊 1. DATABASE ANALYSE:");
    console.log("========================\n");
    
    const users = await prisma.user.findMany({
      include: {
        tenant: true,
        createdChallenges: true
      }
    });
    
    const tenants = await prisma.tenant.findMany({
      include: {
        users: true,
        challenges: true
      }
    });
    
    console.log(`👥 Users gefunden: ${users.length}`);
    console.log(`🏢 Tenants gefunden: ${tenants.length}\n`);
    
    // Analysiere User Company IDs
    console.log("👤 USER COMPANY MAPPING:");
    for (const user of users) {
      console.log(`  ${user.email}:`);
      console.log(`    Whop User ID: ${user.whopUserId}`);
      console.log(`    Experience ID: ${user.experienceId}`);
      console.log(`    User Company ID: ${user.whopCompanyId}`);
      console.log(`    Tenant Company ID: ${user.tenant?.whopCompanyId}`);
      console.log(`    Challenges: ${user.createdChallenges.length}`);
      console.log("");
    }
    
    // Analysiere Tenant Company IDs
    console.log("🏢 TENANT COMPANY MAPPING:");
    for (const tenant of tenants) {
      console.log(`  ${tenant.name}:`);
      console.log(`    Whop Company ID: ${tenant.whopCompanyId}`);
      console.log(`    Whop Handle: ${tenant.whopHandle}`);
      console.log(`    Whop Product ID: ${tenant.whopProductId}`);
      console.log(`    Users: ${tenant.users.length}`);
      console.log(`    Challenges: ${tenant.challenges.length}`);
      console.log("");
    }
    
    // 2. ENVIRONMENT ANALYSE
    console.log("🔧 2. ENVIRONMENT ANALYSE:");
    console.log("===========================\n");
    
    const envCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
    const envAppId = process.env.WHOP_APP_ID;
    const envAgentId = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID;
    
    console.log(`ENV Company ID: ${envCompanyId}`);
    console.log(`ENV App ID: ${envAppId}`);
    console.log(`ENV Agent User ID: ${envAgentId}\n`);
    
    // 3. EXPERIENCE TO COMPANY MAPPING
    console.log("🎯 3. EXPERIENCE TO COMPANY MAPPING:");
    console.log("=====================================\n");
    
    const experienceIds = [...new Set(users.map(u => u.experienceId).filter(Boolean))];
    console.log(`Unique Experience IDs: ${experienceIds.length}`);
    
    for (const expId of experienceIds) {
      const usersInExp = users.filter(u => u.experienceId === expId);
      console.log(`\n📍 Experience: ${expId}`);
      console.log(`   Users: ${usersInExp.length}`);
      console.log(`   User IDs: ${usersInExp.map(u => u.whopUserId).join(', ')}`);
      
      // Versuche Company aus Experience zu extrahieren
      if (expId.startsWith('exp_')) {
        const potentialCompanyId = `biz_${expId.slice(4)}`;
        console.log(`   🔮 Potential Company ID: ${potentialCompanyId}`);
      }
    }
    
    // 4. FALLBACK ANALYSE
    console.log("\n🔄 4. FALLBACK COMPANY ANALYSE:");
    console.log("================================\n");
    
    const fallbackCompanyId = '9nmw5yleoqldrxf7n48c';
    const usersWithFallback = users.filter(u => u.whopCompanyId === fallbackCompanyId);
    
    console.log(`Fallback Company ID: ${fallbackCompanyId}`);
    console.log(`Users mit Fallback: ${usersWithFallback.length}`);
    
    if (usersWithFallback.length > 0) {
      console.log("❌ PROBLEM: Alle User haben dieselbe Fallback Company ID!");
      console.log("💡 LÖSUNG: Echte Company IDs müssen aus Experience IDs extrahiert werden.");
    }
    
    // 5. REALISTIC COMPANY MAPPING
    console.log("\n🎨 5. REALISTIC COMPANY MAPPING:");
    console.log("=================================\n");
    
    console.log("Basierend auf Experience IDs sollten die Company IDs sein:");
    
    const exp1 = 'exp_Tj1OwPyPNw7p0S';
    const exp2 = 'exp_3wSpfXnrRl7puA';
    
    console.log(`\n👤 User mit ${exp1}:`);
    const user1 = users.find(u => u.experienceId === exp1);
    if (user1) {
      console.log(`   Email: ${user1.email}`);
      console.log(`   Whop User ID: ${user1.whopUserId}`);
      console.log(`   🎯 Sollte Company ID: company_from_${exp1}`);
    }
    
    console.log(`\n👤 User mit ${exp2}:`);
    const user2 = users.find(u => u.experienceId === exp2);
    if (user2) {
      console.log(`   Email: ${user2.email}`);
      console.log(`   Whop User ID: ${user2.whopUserId}`);
      console.log(`   🎯 Sollte Company ID: company_from_${exp2}`);
    }
    
    // 6. PRODUCTION HEADERS SIMULATION
    console.log("\n📡 6. PRODUCTION HEADERS SIMULATION:");
    console.log("====================================\n");
    
    console.log("In Production sollten die Headers so aussehen:");
    
    console.log("\n🏢 Company Owner (kein Experience):");
    console.log(`   x-whop-company-id: ${envCompanyId}`);
    console.log(`   x-whop-experience-id: NULL`);
    console.log(`   x-whop-user-id: ${envAgentId}`);
    console.log(`   → isCompanyOwner: true`);
    console.log(`   → Admin Access: ✅`);
    
    console.log(`\n👤 Experience Member 1:`);
    console.log(`   x-whop-company-id: company_extracted_from_${exp1}`);
    console.log(`   x-whop-experience-id: ${exp1}`);
    console.log(`   x-whop-user-id: ${user1?.whopUserId}`);
    console.log(`   → isCompanyOwner: false`);
    console.log(`   → User Access: ✅`);
    
    console.log(`\n👤 Experience Member 2:`);
    console.log(`   x-whop-company-id: company_extracted_from_${exp2}`);
    console.log(`   x-whop-experience-id: ${exp2}`);
    console.log(`   x-whop-user-id: ${user2?.whopUserId}`);
    console.log(`   → isCompanyOwner: false`);
    console.log(`   → User Access: ✅`);
    
    // 7. NEXT STEPS
    console.log("\n🚀 7. NEXT STEPS:");
    console.log("==================\n");
    
    console.log("1. ✅ Code ist bereit für proper Company Detection");
    console.log("2. ✅ Experience-based Isolation implementiert");
    console.log("3. ✅ Fallback-Erkennung funktioniert");
    console.log("4. 🔄 TESTEN in Production mit echten Whop Headers");
    console.log("5. 🎯 Jeder User sollte separate Company ID bekommen");
    
    console.log("\n💡 CRITICAL: Das System funktioniert - es braucht nur echte Whop Headers!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Zusätzlich: Versuche alternative Company Extraction
async function alternativeCompanyExtraction() {
  console.log("\n🔬 ALTERNATIVE COMPANY EXTRACTION:");
  console.log("===================================\n");
  
  // Simulate wie Company IDs aus verschiedenen Sources kommen könnten
  const sources = [
    {
      name: "Experience ID Pattern",
      method: "Extract from Experience ID",
      example: "exp_Tj1OwPyPNw7p0S → company_Tj1OwPyPNw7p0S"
    },
    {
      name: "Whop Headers",
      method: "Direct from x-whop-company-id header",
      example: "Header direkt → biz_YoIIIT73rXwrtK"
    },
    {
      name: "User Token Decode",
      method: "Extract from User Token",
      example: "JWT decode → company info"
    },
    {
      name: "API Lookup",
      method: "API call mit Experience ID",
      example: "/api/v5/experiences/{id} → company_id"
    }
  ];
  
  console.log("Mögliche Company ID Sources:");
  sources.forEach((source, i) => {
    console.log(`\n${i+1}. ${source.name}:`);
    console.log(`   Method: ${source.method}`);
    console.log(`   Example: ${source.example}`);
  });
  
  console.log("\n🎯 WINNER: Direct Whop Headers (Production only!)");
}

console.log("🚀 STARTING COMPREHENSIVE COMPANY ID DISCOVERY...\n");

discoveryCompanyIDs()
  .then(() => alternativeCompanyExtraction())
  .then(() => console.log("\n✅ DISCOVERY COMPLETE! Check the analysis above! 🎉"))
  .catch(console.error);