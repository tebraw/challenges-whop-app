#!/usr/bin/env node
/**
 * 🚀 WHOP REAL DATA INTEGRATION
 * 
 * Updates tenant data with real Whop handles and product IDs
 * For your specific example: company9nmw5yleoqldr → appmafia + prod_eDCd1IVJV9gxZ
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateWhopTenantData() {
  console.log('🔍 UPDATING TENANT WITH REAL WHOP DATA\n');

  try {
    // Your specific company data based on your example
    const realWhopData = {
      whopCompanyId: '9nmw5yleoqldr', // From your URL
      whopHandle: 'appmafia',         // From your example
      whopProductId: 'prod_eDCd1IVJV9gxZ', // Your product ID
      tenantName: 'AppMafia'          // Clean name
    };

    console.log('📋 REAL WHOP DATA:');
    console.log(`   Company ID: ${realWhopData.whopCompanyId}`);
    console.log(`   Handle: ${realWhopData.whopHandle}`);
    console.log(`   Product ID: ${realWhopData.whopProductId}`);
    console.log(`   Name: ${realWhopData.tenantName}\n`);

    // Find or create tenant with your company ID
    let tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { whopCompanyId: realWhopData.whopCompanyId },
          { whopCompanyId: `biz_${realWhopData.whopCompanyId}` },
          { whopCompanyId: `company${realWhopData.whopCompanyId}` }
        ]
      }
    });

    if (!tenant) {
      console.log('🆕 CREATING NEW TENANT WITH REAL DATA...');
      tenant = await prisma.tenant.create({
        data: {
          name: realWhopData.tenantName,
          whopCompanyId: realWhopData.whopCompanyId,
          whopHandle: realWhopData.whopHandle,
          whopProductId: realWhopData.whopProductId
        }
      });
      console.log('✅ New tenant created!');
    } else {
      console.log('🔄 UPDATING EXISTING TENANT WITH REAL DATA...');
      tenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          name: realWhopData.tenantName,
          whopHandle: realWhopData.whopHandle,
          whopProductId: realWhopData.whopProductId
        }
      });
      console.log('✅ Tenant updated!');
    }

    console.log('\n📊 UPDATED TENANT:');
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Name: ${tenant.name}`);
    console.log(`   Whop Company ID: ${tenant.whopCompanyId}`);
    console.log(`   Whop Handle: ${tenant.whopHandle}`);
    console.log(`   Whop Product ID: ${tenant.whopProductId}`);

    console.log('\n🎯 URL COMPARISON:');
    console.log('❌ OLD URL: https://whop.com/company9nmw5yleoqldr/');
    console.log('✅ NEW URL: https://whop.com/appmafia/?productId=prod_eDCd1IVJV9gxZ');
    console.log('✅ MATCHES YOUR EXAMPLE: https://whop.com/appmafia/?productId=prod_OL31fRK1OEb1Y&card_type=info_card');

    console.log('\n🚀 NEXT: Test the discover page to see the new optimized URLs!');

  } catch (error) {
    console.error('❌ Error updating tenant data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateWhopTenantData();