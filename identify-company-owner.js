const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function identifyCompanyOwner() {
  console.log('🔍 IDENTIFYING COMPANY OWNER from Real Installation\n');
  
  try {
    // Get current users
    const users = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    console.log('👥 CURRENT USERS:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   User ID: ${user.whopUserId}`);
      console.log(`   Company ID: ${user.whopCompanyId}`);
      console.log(`   Experience ID: ${user.experienceId || 'NULL'}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });
    
    console.log('🎯 COMPANY OWNER DETECTION LOGIC:');
    console.log('In echten Whop Apps:');
    console.log('• Company Owner (App Installer) hat KEINE Experience ID');
    console.log('• Company Members haben Experience IDs');
    console.log('');
    
    console.log('📋 CURRENT STATE ANALYSIS:');
    console.log('• Beide User haben Experience IDs');
    console.log('• → Beide werden als Members erkannt');
    console.log('• → Keiner wird als Company Owner erkannt');
    console.log('• → Deshalb kein Admin-Zugang!');
    console.log('');
    
    console.log('='.repeat(60));
    console.log('🛠️ LÖSUNG 1: COMPANY OWNER SIMULIEREN\n');
    
    console.log('Option A: Ersten User zu Company Owner machen');
    console.log(`   User: ${users[0]?.email}`);
    console.log(`   Action: Experience ID entfernen → wird Company Owner`);
    console.log('');
    
    console.log('Option B: Zweiten User zu Company Owner machen');
    console.log(`   User: ${users[1]?.email}`);
    console.log(`   Action: Experience ID entfernen → wird Company Owner`);
    console.log('');
    
    console.log('='.repeat(60));
    console.log('🛠️ LÖSUNG 2: SEPARATE COMPANIES\n');
    
    console.log('Wenn ihr separate Companies habt:');
    console.log('1. Kollege installiert App in seiner eigenen Company');
    console.log('2. Jeder bekommt eigene Company ID');
    console.log('3. Komplette Datentrennung');
    console.log('');
    
    console.log('='.repeat(60));
    console.log('❓ WELCHE LÖSUNG MÖCHTEST DU?\n');
    
    console.log('A) User 1 zu Company Owner machen (Experience ID entfernen)');
    console.log('B) User 2 zu Company Owner machen (Experience ID entfernen)');
    console.log('C) Beiden Admin-Rechte geben (Kollaboration)');
    console.log('D) Separate Company Installation für Kollegen');
    console.log('');
    
    console.log('💡 Empfehlung: Wer von euch hat die App installiert?');
    console.log('   → Der Installer sollte Company Owner/Admin werden!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

identifyCompanyOwner();