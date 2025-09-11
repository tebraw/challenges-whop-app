// Debug Production Authentication
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugProductionAuth() {
  console.log('🔍 PRODUCTION AUTHENTICATION DEBUG');
  console.log('=====================================');
  
  try {
    // 1. Check current users in database
    console.log('\n1️⃣ CHECKING DATABASE USERS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        whopUserId: true,
        whopCompanyId: true,
        tenantId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
      console.log(`    whopUserId: ${user.whopUserId || 'none'}`);
      console.log(`    whopCompanyId: ${user.whopCompanyId || 'none'}`);
      console.log(`    tenantId: ${user.tenantId}`);
      console.log('');
    });
    
    // 2. Check tenants
    console.log('2️⃣ CHECKING TENANTS:');
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        whopCompanyId: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${tenants.length} tenants:`);
    tenants.forEach(tenant => {
      console.log(`  - ${tenant.name} (${tenant.id})`);
      console.log(`    whopCompanyId: ${tenant.whopCompanyId || 'none'}`);
      console.log('');
    });
    
    // 3. Check environment variables
    console.log('3️⃣ CHECKING ENVIRONMENT:');
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`ENABLE_DEV_AUTH: ${process.env.ENABLE_DEV_AUTH || 'not set'}`);
    console.log(`WHOP_API_KEY: ${process.env.WHOP_API_KEY ? 'set' : 'not set'}`);
    console.log(`NEXT_PUBLIC_WHOP_APP_ID: ${process.env.NEXT_PUBLIC_WHOP_APP_ID || 'not set'}`);
    console.log(`NEXT_PUBLIC_WHOP_COMPANY_ID: ${process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'not set'}`);
    
    // 4. Create/Update admin user for production access
    console.log('\n4️⃣ ENSURING PRODUCTION ADMIN ACCESS:');
    
    // Find default tenant or create one
    let defaultTenant = await prisma.tenant.findFirst({
      where: { whopCompanyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID }
    });
    
    if (!defaultTenant) {
      defaultTenant = await prisma.tenant.create({
        data: {
          name: 'Production Company',
          whopCompanyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_YoIIIT73rXwrtK'
        }
      });
      console.log('✅ Created production tenant:', defaultTenant.name);
    }
    
    // Create/update admin user for your Whop account
    const adminUser = await prisma.user.upsert({
      where: { 
        whopUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID || 'user_Z9GOqqGEJWyjG'
      },
      create: {
        email: 'admin@challenges-app.com',
        name: 'Production Admin',
        role: 'ADMIN',
        whopUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID || 'user_Z9GOqqGEJWyjG',
        whopCompanyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_YoIIIT73rXwrtK',
        tenantId: defaultTenant.id
      },
      update: {
        role: 'ADMIN',
        whopCompanyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_YoIIIT73rXwrtK',
        tenantId: defaultTenant.id
      }
    });
    
    console.log('✅ Production admin user ready:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Whop User ID: ${adminUser.whopUserId}`);
    console.log(`   Whop Company ID: ${adminUser.whopCompanyId}`);
    
    // 5. Show authentication requirements for production
    console.log('\n5️⃣ PRODUCTION AUTHENTICATION REQUIREMENTS:');
    console.log('To access admin features in production, you need:');
    console.log('1. Be logged in as a Whop company owner');
    console.log('2. Access via Whop Dashboard or Experience context');
    console.log('3. Have the correct Whop headers/tokens');
    console.log('');
    console.log('🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Check if you are accessing via Whop Dashboard');
    console.log('2. Verify your Whop user token/headers are present');
    console.log('3. Ensure you are the owner of company:', process.env.NEXT_PUBLIC_WHOP_COMPANY_ID);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugProductionAuth();
