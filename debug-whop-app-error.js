// debug-whop-app-error.js - Diagnose "Something went wrong" error in Whop app
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugWhopAppError() {
  console.log('🔍 DEBUGGING WHOP APP "SOMETHING WENT WRONG" ERROR');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check Database Connection
    console.log('\n1. 🗄️ CHECKING DATABASE CONNECTION');
    console.log('-'.repeat(40));
    
    const userCount = await prisma.user.count();
    const challengeCount = await prisma.challenge.count();
    const tenantCount = await prisma.tenant.count();
    
    console.log('✅ Database connected successfully');
    console.log(`📊 Users: ${userCount}, Challenges: ${challengeCount}, Tenants: ${tenantCount}`);
    
    // 2. Check Environment Variables
    console.log('\n2. 🔧 CHECKING ENVIRONMENT VARIABLES');
    console.log('-'.repeat(40));
    
    const requiredEnvVars = [
      'WHOP_API_KEY',
      'NEXT_PUBLIC_WHOP_APP_ID', 
      'NEXT_PUBLIC_WHOP_AGENT_USER_ID',
      'NEXT_PUBLIC_WHOP_COMPANY_ID',
      'DATABASE_URL'
    ];
    
    let missingVars = [];
    
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (!value || value === 'fallback' || value === 'your_client_id_here') {
        missingVars.push(varName);
        console.log(`❌ ${varName}: MISSING or PLACEHOLDER`);
      } else {
        console.log(`✅ ${varName}: ${varName.includes('KEY') ? '[HIDDEN]' : value.substring(0, 20)}...`);
      }
    });
    
    if (missingVars.length > 0) {
      console.log('\n🚨 CRITICAL: Missing environment variables detected!');
      console.log('These variables need to be set properly in .env.local:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
    }
    
    // 3. Check for Common Issues
    console.log('\n3. 🔍 CHECKING COMMON WHOP APP ISSUES');
    console.log('-'.repeat(40));
    
    // Check app URL configuration
    const whopAppUrl = process.env.WHOP_APP_URL;
    const currentPort = process.env.PORT || '3000';
    
    console.log(`🌐 App URL: ${whopAppUrl}`);
    console.log(`📡 Current Port: ${currentPort}`);
    
    if (whopAppUrl?.includes('localhost:3000') && currentPort !== '3000') {
      console.log('⚠️  WARNING: App URL is set to port 3000 but app might be running on different port');
      console.log('   This can cause iframe loading issues in Whop');
    }
    
    // Check for experience-based data
    const experienceIds = await prisma.challenge.findMany({
      select: { experienceId: true },
      distinct: ['experienceId']
    });
    
    console.log(`🎭 Experience IDs in database: ${experienceIds.length}`);
    experienceIds.slice(0, 5).forEach(exp => {
      console.log(`   - ${exp.experienceId}`);
    });
    
    // 4. Test Whop SDK Connection
    console.log('\n4. 🔌 TESTING WHOP SDK CONNECTION');
    console.log('-'.repeat(40));
    
    try {
      const { WhopServerSdk } = require('@whop/api');
      
      const whopSdk = WhopServerSdk({
        appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
        appApiKey: process.env.WHOP_API_KEY ?? "fallback",
        onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
        companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      });
      
      // Try a simple API call
      console.log('🔄 Testing Whop SDK initialization...');
      console.log('✅ Whop SDK created successfully');
      
      // Note: We can't test actual API calls here without proper tokens
      console.log('ℹ️  Full API testing requires user context from Whop iframe');
      
    } catch (error) {
      console.log('❌ Whop SDK Error:', error.message);
    }
    
    // 5. Check for Recent Errors in Challenge Creation
    console.log('\n5. 🚨 CHECKING FOR RECENT DATABASE ERRORS');
    console.log('-'.repeat(40));
    
    // Look for challenges with missing required fields
    const allChallenges = await prisma.challenge.findMany({
      select: {
        id: true,
        title: true,
        experienceId: true,
        tenantId: true,
        createdAt: true
      }
    });
    
    const challengesWithIssues = allChallenges.filter(challenge => 
      !challenge.experienceId || !challenge.tenantId || 
      challenge.experienceId === '' || challenge.tenantId === ''
    );
    
    if (challengesWithIssues.length > 0) {
      console.log(`❌ Found ${challengesWithIssues.length} challenges with missing required fields:`);
      challengesWithIssues.forEach(challenge => {
        console.log(`   - ${challenge.title} (${challenge.id}): experienceId=${challenge.experienceId}, tenantId=${challenge.tenantId}`);
      });
    } else {
      console.log('✅ All challenges have required fields');
    }
    
    // 6. Provide Troubleshooting Steps
    console.log('\n6. 🛠️  TROUBLESHOOTING STEPS FOR COLLEAGUE');
    console.log('-'.repeat(40));
    
    console.log('If your colleague sees "Something went wrong":');
    console.log('');
    console.log('1. 🔍 CHECK BROWSER CONSOLE:');
    console.log('   - Press F12 in browser');
    console.log('   - Look for red error messages');
    console.log('   - Screenshot any errors and share them');
    console.log('');
    console.log('2. 🔄 BASIC TROUBLESHOOTING:');
    console.log('   - Hard refresh the page (Ctrl+F5)');
    console.log('   - Clear browser cache and cookies');
    console.log('   - Try in incognito/private mode');
    console.log('   - Try different browser');
    console.log('');
    console.log('3. 🔐 CHECK WHOP APP INSTALLATION:');
    console.log('   - Ensure app is properly installed in their Whop company');
    console.log('   - Check if they have admin permissions in their company');
    console.log('   - Verify the app URL in Whop matches the deployed URL');
    console.log('');
    console.log('4. 🌐 NETWORK ISSUES:');
    console.log('   - Check if app URL is accessible from external network');
    console.log('   - Verify CORS headers allow Whop iframe embedding');
    console.log('   - Test if API endpoints respond correctly');
    
    // 7. Create diagnostic URL for colleague
    console.log('\n7. 🔗 DIAGNOSTIC URLS FOR TESTING');
    console.log('-'.repeat(40));
    
    const baseUrl = whopAppUrl || 'http://localhost:3001';
    console.log(`📊 Debug endpoint: ${baseUrl}/api/debug/whop-headers`);
    console.log(`🔍 Token test: ${baseUrl}/api/debug/token-test`);
    console.log(`👤 User context: ${baseUrl}/api/debug/user`);
    console.log(`🏢 Company detection: ${baseUrl}/api/debug/company-detection`);
    
    console.log('\n✅ DIAGNOSIS COMPLETE');
    console.log('Share this output with your colleague to help debug the issue.');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    
    if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\n🔥 DATABASE CONNECTION FAILED');
      console.log('The database is not accessible. Check DATABASE_URL in .env.local');
    } else if (error.message.includes('Invalid `prisma')) {
      console.log('\n🔥 PRISMA CLIENT ERROR');
      console.log('Run: npx prisma generate');
    }
  } finally {
    await prisma.$disconnect();
  }
}

debugWhopAppError().catch(console.error);