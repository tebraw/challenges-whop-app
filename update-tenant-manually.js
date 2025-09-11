/**
 * 🔧 MANUAL TENANT UPDATE
 * 
 * Setzt echte Community-Daten manuell für Testing
 */

const { PrismaClient } = require('@prisma/client');

async function updateTenantManually() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Updating tenant manually with real data...\n');

    // Update tenant with real ChallengesAPP data
    const updatedTenant = await prisma.tenant.update({
      where: { 
        whopCompanyId: '9nmw5yleoqldrxf7n48c' 
      },
      data: {
        name: 'ChallengesAPP',
        whopHandle: 'challengesapp',
        whopProductId: 'prod_eDCd1IVJV9gxZ'
      }
    });

    console.log('✅ Tenant updated with real data:');
    console.log('📋 Updated tenant data:', {
      name: updatedTenant.name,
      whopHandle: updatedTenant.whopHandle,
      whopProductId: updatedTenant.whopProductId
    });

    // Test URL generation
    const { getOptimizedWhopUrl } = require('./lib/whop-url-optimizer');
    const optimizedUrl = getOptimizedWhopUrl(updatedTenant);
    
    console.log('\n🔗 Generated optimized URL:', optimizedUrl);
    
    if (optimizedUrl.includes('challengesapp')) {
      console.log('🎉 SUCCESS: URL now uses community handle!');
    } else {
      console.log('⚠️ URL still using company ID fallback');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTenantManually();