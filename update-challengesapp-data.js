#!/usr/bin/env node
/**
 * 🔧 UPDATE TENANT MIT ECHTEN "ChallengesAPP" DATEN
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTenantWithRealData() {
  console.log('🔧 UPDATE TENANT MIT ECHTEN DATEN\n');

  try {
    // Finde deinen Tenant mit der Company ID
    const tenant = await prisma.tenant.findFirst({
      where: {
        whopCompanyId: '9nmw5yleoqldrxf7n48c'
      }
    });

    if (!tenant) {
      console.log('❌ Tenant mit Company ID 9nmw5yleoqldrxf7n48c nicht gefunden!');
      return;
    }

    console.log('📋 AKTUELLER TENANT:');
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Name: ${tenant.name}`);
    console.log(`   Company ID: ${tenant.whopCompanyId}`);
    console.log(`   Handle: ${tenant.whopHandle}`);
    console.log(`   Product ID: ${tenant.whopProductId}\n`);

    // Update mit echten ChallengesAPP Daten
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        name: 'ChallengesAPP',                    // Echter Name
        whopHandle: 'challengesapp',              // Automatisch erstellt aus Name
        whopProductId: 'prod_eDCd1IVJV9gxZ'      // Deine echte Product ID
      }
    });

    console.log('✅ TENANT ERFOLGREICH UPDATED:');
    console.log(`   ID: ${updatedTenant.id}`);
    console.log(`   Name: ${updatedTenant.name}`);
    console.log(`   Company ID: ${updatedTenant.whopCompanyId}`);
    console.log(`   Handle: ${updatedTenant.whopHandle}`);
    console.log(`   Product ID: ${updatedTenant.whopProductId}\n`);

    console.log('🎯 URL VERGLEICH:');
    console.log('❌ VORHER: https://whop.com/company9nmw5yleoqldr/');
    console.log('✅ JETZT:  https://whop.com/challengesapp/?productId=prod_eDCd1IVJV9gxZ');
    console.log('✅ PERFEKT: Genau wie dein Beispiel-Pattern!\n');

    console.log('🚀 NÄCHSTER SCHRITT: Teste die discover page!');

  } catch (error) {
    console.error('❌ Fehler beim Update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTenantWithRealData();