#!/usr/bin/env node
/**
 * 🔍 CHECK CURRENT TENANT DATA
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTenants() {
  console.log('🔍 AKTUELLE TENANTS IN DATENBANK:\n');
  
  try {
    const tenants = await prisma.tenant.findMany();
    
    if (tenants.length === 0) {
      console.log('❌ Keine Tenants gefunden!');
      return;
    }
    
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}:`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Whop Company ID: ${tenant.whopCompanyId}`);
      console.log(`   Whop Handle: ${tenant.whopHandle}`);
      console.log(`   Whop Product ID: ${tenant.whopProductId}`);
      console.log('   Created: ' + tenant.createdAt);
      console.log('');
    });
    
    console.log('🎯 WELCHER TENANT IST DEINER?');
    console.log('Das AppMafia-Beispiel sollte gelöscht werden!');
    
  } catch (error) {
    console.error('❌ Fehler beim Laden der Tenants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenants();