const { PrismaClient } = require('@prisma/client');

async function findUsersAndCompanies() {
  const prisma = new PrismaClient();
  
  try {
    console.log("🔍 Suche alle User in der Datenbank...\n");
    
    // Alle User finden
    const users = await prisma.user.findMany({
      include: {
        createdChallenges: {
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            whopCompanyId: true,
            whopHandle: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Gefunden: ${users.length} User\n`);
    
    for (const user of users) {
      console.log(`👤 USER: ${user.email || user.id}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Whop Company ID: ${user.whopCompanyId || 'nicht gesetzt'}`);
      console.log(`   Whop User ID: ${user.whopUserId || 'nicht gesetzt'}`);
      console.log(`   Experience ID: ${user.experienceId || 'nicht gesetzt'}`);
      console.log(`   Tenant: ${user.tenant?.name || 'unbekannt'} (${user.tenantId})`);
      console.log(`   Tenant Whop Company: ${user.tenant?.whopCompanyId || 'nicht gesetzt'}`);
      console.log(`   Challenges erstellt: ${user.createdChallenges.length}`);
      console.log(`   Rolle: ${user.role}`);
      console.log(`   Erstellt: ${user.createdAt}`);
      
      if (user.createdChallenges.length > 0) {
        console.log(`   📝 Challenges:`);
        user.createdChallenges.forEach(challenge => {
          console.log(`      - ${challenge.title} (${challenge.id})`);
        });
      }
      console.log('');
    }
    
    // Jetzt versuchen, über Whop API die echten Company IDs zu holen
    console.log("🔗 Versuche Whop API Verbindung...\n");
    
    const whopApiKey = process.env.WHOP_API_KEY;
    const whopClientId = process.env.WHOP_CLIENT_ID;
    
    if (!whopApiKey && !whopClientId) {
      console.log("⚠️  Keine Whop API Credentials gefunden in .env");
      console.log("Verfügbare ENV vars:");
      Object.keys(process.env).filter(key => key.includes('WHOP')).forEach(key => {
        console.log(`   ${key}: ${process.env[key] ? 'gesetzt' : 'leer'}`);
      });
    }
    
    // User mit Whop User IDs versuchen über API zu verifizieren
    const usersWithWhopId = users.filter(u => u.whopUserId);
    console.log(`\n🔍 ${usersWithWhopId.length} User haben Whop User IDs:`);
    
    for (const user of usersWithWhopId) {
      console.log(`\n👤 User ${user.email || user.id}:`);
      console.log(`   Whop User ID: ${user.whopUserId}`);
      console.log(`   User Whop Company ID: ${user.whopCompanyId}`);
      console.log(`   Tenant Whop Company ID: ${user.tenant?.whopCompanyId}`);
      
      // Hier könnten wir die Whop API aufrufen, wenn wir einen API Key hätten
      // Für jetzt schauen wir, welche Company IDs wir haben
    }
    
    // Unique Company IDs analysieren
    const whopCompanyIds = [...new Set(users.map(u => u.whopCompanyId).filter(Boolean))];
    const tenantCompanyIds = [...new Set(users.map(u => u.tenant?.whopCompanyId).filter(Boolean))];
    
    console.log(`\n🏢 User Whop Company IDs:`);
    whopCompanyIds.forEach(companyId => {
      const usersInCompany = users.filter(u => u.whopCompanyId === companyId);
      console.log(`   ${companyId}: ${usersInCompany.length} User`);
      usersInCompany.forEach(u => {
        console.log(`      - ${u.email || u.id} (${u.createdChallenges.length} challenges)`);
      });
    });
    
    console.log(`\n🏢 Tenant Whop Company IDs:`);
    tenantCompanyIds.forEach(companyId => {
      const usersInTenantCompany = users.filter(u => u.tenant?.whopCompanyId === companyId);
      console.log(`   ${companyId}: ${usersInTenantCompany.length} User`);
      usersInTenantCompany.forEach(u => {
        console.log(`      - ${u.email || u.id} (${u.createdChallenges.length} challenges)`);
      });
    });
    
  } catch (error) {
    console.error("❌ Fehler:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Zusätzlich: Whop API direkt verwenden
async function testWhopAPI() {
  console.log("\n🔧 Teste Whop API direkt...");
  
  const whopClientId = process.env.WHOP_CLIENT_ID;
  const whopClientSecret = process.env.WHOP_CLIENT_SECRET;
  
  if (!whopClientId || !whopClientSecret) {
    console.log("⚠️  Keine Whop Credentials gefunden");
    return;
  }
  
  console.log(`✅ Client ID: ${whopClientId}`);
  console.log(`✅ Client Secret: ${whopClientSecret ? 'gesetzt' : 'fehlt'}`);
  
  // Versuche eine einfache API-Anfrage
  try {
    const response = await fetch('https://api.whop.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY || 'no-token'}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Whop API Response:", data);
    } else {
      console.log(`❌ Whop API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log("❌ Whop API Request failed:", error.message);
  }
}

// Zusätzlich: Whop SDK verwenden wenn möglich
async function testWhopSDK() {
  console.log("\n🔧 Teste Whop SDK...");
  
  try {
    // Versuche Whop SDK zu laden
    const { validateToken } = require("@whop-apps/sdk");
    console.log("✅ Whop SDK gefunden");
    
    // Hier könnten wir Token validieren wenn wir welche hätten
    console.log("Token Validation würde hier passieren...");
    
  } catch (error) {
    console.log("⚠️  Whop SDK nicht verfügbar:", error.message);
  }
}

console.log("🚀 Starte User & Company Analyse...\n");
findUsersAndCompanies().then(() => {
  return testWhopAPI();
}).then(() => {
  return testWhopSDK();
}).then(() => {
  console.log("\n✅ Analyse abgeschlossen!");
}).catch(console.error);