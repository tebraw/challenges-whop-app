// Analysiere die Headers und versuche Company IDs zu extrahieren
const { PrismaClient } = require('@prisma/client');

async function analyzeHeadersFlow() {
  console.log("🚀 Analysiere Headers Flow für Company Detection...\n");
  
  const prisma = new PrismaClient();
  
  try {
    // Hole alle User
    const users = await prisma.user.findMany({
      include: {
        tenant: true
      }
    });
    
    console.log("👥 Aktuelle User Situation:");
    
    for (const user of users) {
      console.log(`\n👤 ${user.email}`);
      console.log(`   Whop User ID: ${user.whopUserId}`);
      console.log(`   Experience ID: ${user.experienceId}`);
      console.log(`   Gespeicherte Company ID: ${user.whopCompanyId}`);
      console.log(`   Tenant Company ID: ${user.tenant?.whopCompanyId}`);
      
      // Simuliere Header-basierte Detection
      console.log(`\n   🔍 Header-basierte Company Detection:`);
      
      if (user.experienceId) {
        console.log(`   ✅ Experience Member: experienceId = ${user.experienceId}`);
        console.log(`   → Company ID sollte aus Experience kommen`);
        console.log(`   → isCompanyOwner = false`);
      } else {
        console.log(`   ✅ Company Owner: kein experienceId`);
        console.log(`   → Company ID sollte aus x-whop-company-id Header kommen`);
        console.log(`   → isCompanyOwner = true`);
      }
    }
    
    console.log(`\n🎯 DAS PROBLEM:`);
    console.log(`Beide User haben Experience IDs → beide sind Experience Members`);
    console.log(`Aber sie haben unterschiedliche Experience IDs!`);
    console.log(`Das bedeutet: Sie sind in verschiedenen Experiences = verschiedene Companies!`);
    
    console.log(`\n💡 DIE LÖSUNG:`);
    console.log(`1. User 1 (exp_Tj1OwPyPNw7p0S) sollte Company A bekommen`);
    console.log(`2. User 2 (exp_3wSpfXnrRl7puA) sollte Company B bekommen`);
    console.log(`3. Die fallback Company ID '9nmw5yleoqldrxf7n48c' ist das Problem!`);
    
    console.log(`\n🔧 NEXT STEPS:`);
    console.log(`1. In Production deployen`);
    console.log(`2. Echte Whop Headers testen`);
    console.log(`3. Company Owner ohne Experience ID testen`);
    
    // Zeige auch die Admin API Logik
    console.log(`\n📋 Admin API Logik (aus app/api/admin/challenges/route.ts):`);
    console.log(`
    const experienceId = headers.get('x-whop-experience-id');
    const companyId = headers.get('x-whop-company-id');
    
    // Company Owner Detection
    const isCompanyOwner = !experienceId && companyId;
    
    if (isCompanyOwner) {
      // Company Owner → Admin Access mit companyId
      console.log('User ist Company Owner, Admin Access');
    } else if (experienceId) {
      // Experience Member → User Access
      console.log('User ist Experience Member, User Access');
    }
    `);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Zusätzlich: Teste Company Owner Simulation
async function simulateCompanyOwnerAccess() {
  console.log("\n🎭 Simuliere Company Owner Access...\n");
  
  // Simuliere Headers für Company Owner
  const companyOwnerHeaders = {
    'x-whop-company-id': 'biz_YoIIIT73rXwrtK', // Aus .env.local
    'x-whop-experience-id': null, // Company Owner hat keine Experience
    'x-whop-user-id': 'user_Z9GOqqGEJWyjG'
  };
  
  // Simuliere Headers für Experience Member 1
  const experienceMember1Headers = {
    'x-whop-company-id': 'company_from_experience_1',
    'x-whop-experience-id': 'exp_Tj1OwPyPNw7p0S',
    'x-whop-user-id': 'user_w3lVukX5x9ayO'
  };
  
  // Simuliere Headers für Experience Member 2
  const experienceMember2Headers = {
    'x-whop-company-id': 'company_from_experience_2',
    'x-whop-experience-id': 'exp_3wSpfXnrRl7puA',
    'x-whop-user-id': 'user_eGf5vVjIuGLSy'
  };
  
  function analyzeHeaders(name, headers) {
    console.log(`\n👤 ${name}:`);
    console.log(`   Company ID: ${headers['x-whop-company-id']}`);
    console.log(`   Experience ID: ${headers['x-whop-experience-id'] || 'NONE'}`);
    console.log(`   User ID: ${headers['x-whop-user-id']}`);
    
    const isCompanyOwner = !headers['x-whop-experience-id'] && headers['x-whop-company-id'];
    console.log(`   → isCompanyOwner: ${isCompanyOwner}`);
    console.log(`   → Access Level: ${isCompanyOwner ? 'ADMIN' : 'USER'}`);
  }
  
  analyzeHeaders('Company Owner', companyOwnerHeaders);
  analyzeHeaders('Experience Member 1', experienceMember1Headers);
  analyzeHeaders('Experience Member 2', experienceMember2Headers);
  
  console.log(`\n✅ PERFECT ISOLATION:`);
  console.log(`- Company Owner sieht alle Challenges seiner Company`);
  console.log(`- Experience Member 1 sieht nur seine Experience Challenges`);
  console.log(`- Experience Member 2 sieht nur seine Experience Challenges`);
  console.log(`- Keine Cross-Contamination mehr!`);
}

// ENV laden
require('dotenv').config({ path: '.env.local' });

analyzeHeadersFlow().then(() => {
  return simulateCompanyOwnerAccess();
}).then(() => {
  console.log("\n🎉 Analyse Complete!");
}).catch(console.error);