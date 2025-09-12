/**
 * 🔍 CHECK LATEST WHOP INSTALLATION
 * 
 * Prüft die neuesten Tenant-Daten nach der Installation
 */

const { PrismaClient } = require('@prisma/client');

async function checkLatestInstallation() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking latest Whop installation data...\n');

    // Hole die neuesten Tenants (sortiert nach Erstellungsdatum)
    const latestTenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        users: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    });

    console.log(`📋 Found ${latestTenants.length} tenants\n`);

    latestTenants.forEach((tenant, index) => {
      console.log(`${index + 1}. TENANT (Created: ${tenant.createdAt}):`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Name: ${tenant.name}`);
      console.log(`   Whop Company ID: ${tenant.whopCompanyId}`);
      console.log(`   Created: ${tenant.createdAt}`);
      
      if (tenant.users.length > 0) {
        console.log(`   USERS:`);
        tenant.users.forEach(user => {
          console.log(`     - ${user.name} (${user.email})`);
          console.log(`       Whop User ID: ${user.whopUserId}`);
          console.log(`       Whop Company ID: ${user.whopCompanyId}`);
          console.log(`       Role: ${user.role}`);
          console.log(`       Created: ${user.createdAt}`);
        });
      }
      console.log('');
    });

    // Finde die neueste Installation (letzte 10 Minuten)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentTenants = await prisma.tenant.findMany({
      where: {
        createdAt: {
          gte: tenMinutesAgo
        }
      },
      include: {
        users: true
      }
    });

    if (recentTenants.length > 0) {
      console.log('🆕 RECENT INSTALLATIONS (last 10 minutes):');
      recentTenants.forEach(tenant => {
        console.log(`   - ${tenant.name} (Company: ${tenant.whopCompanyId})`);
        console.log(`     Created: ${tenant.createdAt}`);
        if (tenant.users.length > 0) {
          console.log(`     User: ${tenant.users[0].name} (${tenant.users[0].email})`);
        }
      });
    } else {
      console.log('ℹ️ No recent installations in the last 10 minutes');
      console.log('💡 Check Vercel logs for real-time installation data');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestInstallation();