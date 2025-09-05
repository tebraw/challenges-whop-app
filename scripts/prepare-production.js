// scripts/prepare-production.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function prepareProduction() {
  try {
    console.log('🧹 Bereite Datenbank für Produktion vor...');
    
    // Lösche alle Test-Daten
    await prisma.enrollment.deleteMany({});
    await prisma.challenge.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});
    
    console.log('✅ Alle Test-Daten gelöscht');
    console.log('🚀 Datenbank ist bereit für Produktion!');
    console.log('');
    console.log('🔥 Nächste Schritte für Whop-Deployment:');
    console.log('1. Umgebungsvariablen für Produktion setzen');
    console.log('2. Datenbank-URL für Produktion konfigurieren');
    console.log('3. Whop App-Credentials eintragen');
    console.log('4. npm run build');
    console.log('5. npm start');
    
  } catch (error) {
    console.error('❌ Fehler beim Vorbereiten der Produktion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

prepareProduction();
