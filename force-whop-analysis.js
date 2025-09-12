/**
 * 🔍 FORCE WHOP DATA ANALYSIS
 * 
 * Simuliert den Auth-Flow um echte Whop-Daten zu analysieren
 */

const { PrismaClient } = require('@prisma/client');

async function forceWhopDataAnalysis() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Forcing Whop data analysis for existing user...\n');

    // Finde den echten User
    const realUser = await prisma.user.findFirst({
      where: {
        whopUserId: 'user_eGf5vVjIuGLSy'
      },
      include: {
        tenant: true
      }
    });

    if (!realUser) {
      console.log('❌ Real user not found');
      return;
    }

    console.log('👤 Found real user:', {
      name: realUser.name,
      email: realUser.email,
      whopUserId: realUser.whopUserId,
      whopCompanyId: realUser.whopCompanyId
    });

    // Simuliere API Call zu Whop um echte Daten zu holen
    const WHOP_API_KEY = process.env.WHOP_API_KEY;
    
    if (!WHOP_API_KEY) {
      console.log('❌ WHOP_API_KEY not found');
      return;
    }

    console.log('\n📡 Making real Whop API call...');
    
    // 1. User Companies Call (wie in auth.ts)
    const userCompaniesResponse = await fetch(`https://api.whop.com/v5/users/${realUser.whopUserId}/companies`, {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 User Companies API Status: ${userCompaniesResponse.status}`);

    if (userCompaniesResponse.ok) {
      const companiesData = await userCompaniesResponse.json();
      
      console.log('\n🔍 REAL WHOP API RESPONSE:');
      console.log('📋 Full API Response:', JSON.stringify(companiesData, null, 2));
      
      if (companiesData.data && companiesData.data.length > 0) {
        console.log('\n🎯 COMPANY DATA ANALYSIS:');
        
        companiesData.data.forEach((company, index) => {
          console.log(`\n${index + 1}. COMPANY:`);
          console.log('🔍 REAL COMPANY DATA FROM WHOP API:', JSON.stringify(company, null, 2));
          console.log('📋 Available Fields:', Object.keys(company));
          
          // Analysiere spezifische Felder
          console.log('\n📊 FIELD ANALYSIS:');
          console.log(`   ✅ ID: ${company.id}`);
          console.log(`   ✅ Name: ${company.name}`);
          console.log(`   ${company.handle ? '✅' : '❌'} Handle: ${company.handle || 'NOT AVAILABLE'}`);
          console.log(`   ${company.username ? '✅' : '❌'} Username: ${company.username || 'NOT AVAILABLE'}`);
          console.log(`   ${company.slug ? '✅' : '❌'} Slug: ${company.slug || 'NOT AVAILABLE'}`);
          console.log(`   ${company.url ? '✅' : '❌'} URL: ${company.url || 'NOT AVAILABLE'}`);
          console.log(`   ${company.vanity_url ? '✅' : '❌'} Vanity URL: ${company.vanity_url || 'NOT AVAILABLE'}`);
        });
      }
    } else {
      console.log(`❌ API call failed: ${userCompaniesResponse.status}`);
      const errorText = await userCompaniesResponse.text();
      console.log('Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceWhopDataAnalysis();