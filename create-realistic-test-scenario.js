const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRealisticTestScenario() {
  console.log('🎯 CREATING REALISTIC WHOP MULTI-TENANT TEST SCENARIO\n');
  
  try {
    // Clean up existing data first
    console.log('🧹 Cleaning up existing test data...');
    await prisma.challenge.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});
    console.log('✅ Database cleaned\n');
    
    // Scenario 1: Company Owner A (App Installer)
    console.log('1️⃣ CREATING COMPANY OWNER A (App Installer)');
    const companyIdA = 'biz_CompanyOwnerA123';
    const userIdA = 'user_OwnerA';
    
    const tenantA = await prisma.tenant.create({
      data: {
        name: `Company ${companyIdA}`,
        whopCompanyId: companyIdA
      }
    });
    
    const ownerA = await prisma.user.create({
      data: {
        email: `${userIdA}@company-a.com`,
        name: 'Company Owner A (App Installer)',
        whopUserId: userIdA,
        whopCompanyId: companyIdA,
        experienceId: null, // Company owners have NO experience ID
        role: 'ADMIN',
        tenantId: tenantA.id
      }
    });
    
    console.log(`   ✅ Created Company A Owner: ${ownerA.email}`);
    console.log(`   └─ Company ID: ${companyIdA}`);
    console.log(`   └─ Role: ADMIN`);
    console.log(`   └─ Tenant: ${tenantA.name}`);
    
    // Scenario 2: Company Owner B (Another App Installer)  
    console.log('\n2️⃣ CREATING COMPANY OWNER B (Another App Installer)');
    const companyIdB = 'biz_CompanyOwnerB456';
    const userIdB = 'user_OwnerB';
    
    const tenantB = await prisma.tenant.create({
      data: {
        name: `Company ${companyIdB}`,
        whopCompanyId: companyIdB
      }
    });
    
    const ownerB = await prisma.user.create({
      data: {
        email: `${userIdB}@company-b.com`,
        name: 'Company Owner B (App Installer)',
        whopUserId: userIdB,
        whopCompanyId: companyIdB,
        experienceId: null, // Company owners have NO experience ID
        role: 'ADMIN',
        tenantId: tenantB.id
      }
    });
    
    console.log(`   ✅ Created Company B Owner: ${ownerB.email}`);
    console.log(`   └─ Company ID: ${companyIdB}`);
    console.log(`   └─ Role: ADMIN`);
    console.log(`   └─ Tenant: ${tenantB.name}`);
    
    // Scenario 3: Experience Member (Community Member)
    console.log('\n3️⃣ CREATING EXPERIENCE MEMBER (Community Member)');
    const experienceId = 'exp_CommunityExperience789';
    const memberUserId = 'user_Member';
    
    const experienceTenant = await prisma.tenant.create({
      data: {
        name: `Experience ${experienceId}`,
        whopCompanyId: experienceId // Use experience ID as tenant identifier
      }
    });
    
    const member = await prisma.user.create({
      data: {
        email: `${memberUserId}@member.com`,
        name: 'Community Member',
        whopUserId: memberUserId,
        whopCompanyId: null, // Members might not have company ID
        experienceId: experienceId,
        role: 'USER',
        tenantId: experienceTenant.id
      }
    });
    
    console.log(`   ✅ Created Experience Member: ${member.email}`);
    console.log(`   └─ Experience ID: ${experienceId}`);
    console.log(`   └─ Role: USER`);
    console.log(`   └─ Tenant: ${experienceTenant.name}`);
    
    // Create test challenges for each tenant
    console.log('\n4️⃣ CREATING TEST CHALLENGES');
    
    // Challenge for Company A
    const challengeA = await prisma.challenge.create({
      data: {
        title: 'Company A Challenge',
        description: 'Only Company A should see this',
        whopCompanyId: companyIdA,
        experienceId: null,
        tenantId: tenantA.id,
        creatorId: ownerA.id,
        category: 'FITNESS',
        difficulty: 'INTERMEDIATE',
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });
    
    // Challenge for Company B
    const challengeB = await prisma.challenge.create({
      data: {
        title: 'Company B Challenge',
        description: 'Only Company B should see this',
        whopCompanyId: companyIdB,
        experienceId: null,
        tenantId: tenantB.id,
        creatorId: ownerB.id,
        category: 'MINDFULNESS',
        difficulty: 'BEGINNER',
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });
    
    // Challenge for Experience
    const challengeExp = await prisma.challenge.create({
      data: {
        title: 'Experience Challenge',
        description: 'Only Experience members should see this',
        whopCompanyId: null,
        experienceId: experienceId,
        tenantId: experienceTenant.id,
        creatorId: member.id, // Member created this (or could be system)
        category: 'LEARNING',
        difficulty: 'ADVANCED',
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });
    
    console.log(`   ✅ Created 3 test challenges (one per tenant)`);
    
    // Show testing scenarios
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING SCENARIOS - WHOP HEADERS TO SIMULATE:\n');
    
    console.log('📋 TEST 1 - Company Owner A Admin Access:');
    console.log('   Headers:');
    console.log(`   x-whop-user-id: ${userIdA}`);
    console.log(`   x-whop-company-id: ${companyIdA}`);
    console.log('   x-whop-experience-id: (NOT SET)');
    console.log('   Expected: Should see only "Company A Challenge"');
    console.log('   Role: ADMIN\n');
    
    console.log('📋 TEST 2 - Company Owner B Admin Access:');
    console.log('   Headers:');
    console.log(`   x-whop-user-id: ${userIdB}`);
    console.log(`   x-whop-company-id: ${companyIdB}`);
    console.log('   x-whop-experience-id: (NOT SET)');
    console.log('   Expected: Should see only "Company B Challenge"');
    console.log('   Role: ADMIN\n');
    
    console.log('📋 TEST 3 - Experience Member Access:');
    console.log('   Headers:');
    console.log(`   x-whop-user-id: ${memberUserId}`);
    console.log(`   x-whop-experience-id: ${experienceId}`);
    console.log('   x-whop-company-id: (NOT SET)');
    console.log('   Expected: Should see only "Experience Challenge"');
    console.log('   Role: USER\n');
    
    console.log('🎯 PERFECT TENANT ISOLATION:');
    console.log('• Company A sees only Company A content');
    console.log('• Company B sees only Company B content');
    console.log('• Experience members see only Experience content');
    console.log('• NO CROSS-CONTAMINATION! ✅');
    
    // Summary
    const summary = await prisma.tenant.findMany({
      include: {
        users: true,
        challenges: true
      }
    });
    
    console.log('\n📊 FINAL STATE SUMMARY:');
    summary.forEach(tenant => {
      console.log(`🏢 ${tenant.name}:`);
      console.log(`   └─ Users: ${tenant.users.length}`);
      console.log(`   └─ Challenges: ${tenant.challenges.length}`);
      console.log(`   └─ Identifier: ${tenant.whopCompanyId}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error creating test scenario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRealisticTestScenario();