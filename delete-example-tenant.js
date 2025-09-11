#!/usr/bin/env node
/**
 * 🗑️ DELETE APPMAFIA EXAMPLE TENANT
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteExample() {
  console.log('🗑️ LÖSCHE APPMAFIA-BEISPIEL...\n');
  
  try {
    const deleted = await prisma.tenant.deleteMany({
      where: {
        OR: [
          { name: 'AppMafia' },
          { whopHandle: 'appmafia' }
        ]
      }
    });
    
    console.log('✅ Gelöscht:', deleted.count, 'Tenants');
    console.log('✅ AppMafia-Beispiel entfernt!');
    
  } catch (error) {
    console.error('❌ Fehler beim Löschen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteExample();