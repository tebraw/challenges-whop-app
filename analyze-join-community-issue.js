// require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function analyzeJoinProblem() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== JOIN COMMUNITY vs JOIN CHALLENGE PROBLEM ===');
    console.log('');
    
    // From logs we know:
    const challengeId = 'cmfyjqn8z000f0he90cwranxl'; // Shows 'Join Community'
    const userId = 'cmfwvq3cp00072bfjq8ve23zx';
    const userTenantId = 'cmfwvpoy500052bfjgioc6wcm';
    const userCompanyId = 'biz_YoIIIT73rXwrtK';
    const experienceId = 'exp_TX6Fwbq4i6779S';
    
    console.log('📋 USER CONTEXT:')
    console.log('- User ID:', userId);
    console.log('- User Tenant:', userTenantId);
    console.log('- User Company:', userCompanyId);
    console.log('- Experience:', experienceId);
    console.log('');
    
    // Get the problematic challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        tenant: true,
        enrollments: {
          where: { userId: userId }
        }
      }
    });
    
    console.log('🎯 PROBLEMATIC CHALLENGE:');
    if (challenge) {
      console.log('- ID:', challenge.id);
      console.log('- Title:', challenge.title);
      console.log('- Tenant ID:', challenge.tenantId);
      console.log('- Experience ID:', challenge.experienceId);
      console.log('- Company ID:', challenge.tenant?.whopCompanyId || 'NULL');
      console.log('- User Enrolled:', challenge.enrollments.length > 0);
      console.log('');
      
      // This is the KEY logic that determines Join Challenge vs Join Community
      const isSameTenant = challenge.tenantId === userTenantId;
      const isSameCompany = challenge.tenant?.whopCompanyId === userCompanyId;
      
      console.log('🔍 BUTTON LOGIC ANALYSIS:');
      console.log('- Challenge Tenant:', challenge.tenantId);
      console.log('- User Tenant:', userTenantId);
      console.log('- Tenant Match:', isSameTenant ? '✅ YES' : '❌ NO');
      console.log('');
      console.log('- Challenge Company:', challenge.tenant?.whopCompanyId || 'NULL');
      console.log('- User Company:', userCompanyId);
      console.log('- Company Match:', isSameCompany ? '✅ YES' : '❌ NO');
      console.log('');
      
      console.log('🎯 EXPECTED BUTTON:');
      if (isSameTenant && isSameCompany) {
        console.log('- Should show: JOIN CHALLENGE ✅');
      } else {
        console.log('- Should show: JOIN COMMUNITY ❌');
        console.log('- Reason: Different tenant/company isolation');
      }
      console.log('');
      
    } else {
      console.log('❌ Challenge not found!');
    }
    
    // Get user's tenant
    const userTenant = await prisma.tenant.findUnique({
      where: { id: userTenantId }
    });
    
    console.log('👤 USER TENANT:');
    if (userTenant) {
      console.log('- ID:', userTenant.id);
      console.log('- Company:', userTenant.whopCompanyId);
      console.log('- Created:', userTenant.createdAt.toISOString());
    }
    console.log('');
    
    // Get ALL challenges in this experience for comparison
    const allChallenges = await prisma.challenge.findMany({
      where: {
        experienceId: experienceId
      },
      include: {
        tenant: true,
        enrollments: {
          where: { userId: userId }
        },
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📊 ALL CHALLENGES IN EXPERIENCE:');
    console.log('Total challenges:', allChallenges.length);
    console.log('');
    
    allChallenges.forEach((ch, index) => {
      const isSameTenant = ch.tenantId === userTenantId;
      const isSameCompany = ch.tenant?.whopCompanyId === userCompanyId;
      const expectedButton = (isSameTenant && isSameCompany) ? 'JOIN CHALLENGE' : 'JOIN COMMUNITY';
      
      console.log(`${index + 1}. ${ch.title.substring(0, 40)}...`);
      console.log(`   ID: ${ch.id}`);
      console.log(`   Tenant: ${ch.tenantId} ${isSameTenant ? '✅' : '❌'}`);
      console.log(`   Company: ${ch.tenant?.whopCompanyId || 'NULL'} ${isSameCompany ? '✅' : '❌'}`);
      console.log(`   Experience: ${ch.experienceId}`);
      console.log(`   Participants: ${ch._count.enrollments}`);
      console.log(`   User Enrolled: ${ch.enrollments.length > 0 ? '✅' : '❌'}`);
      console.log(`   Expected Button: ${expectedButton}`);
      console.log('');
    });
    
    // Find challenges where user CAN join (same tenant/company)
    const joinableByUser = allChallenges.filter(ch => 
      ch.tenantId === userTenantId && ch.tenant?.whopCompanyId === userCompanyId
    );
    
    console.log('✅ CHALLENGES USER CAN JOIN (Same Tenant + Company):');
    console.log('Count:', joinableByUser.length);
    joinableByUser.forEach(ch => {
      console.log(`- ${ch.title} (${ch.id})`);
    });
    console.log('');
    
    // Find cross-community challenges (different tenant/company)
    const crossCommunity = allChallenges.filter(ch => 
      ch.tenantId !== userTenantId || ch.tenant?.whopCompanyId !== userCompanyId
    );
    
    console.log('🌐 CROSS-COMMUNITY CHALLENGES (Different Tenant/Company):');
    console.log('Count:', crossCommunity.length);
    crossCommunity.forEach(ch => {
      console.log(`- ${ch.title} (${ch.id})`);
      console.log(`  Tenant: ${ch.tenantId} vs User: ${userTenantId}`);
      console.log(`  Company: ${ch.tenant?.whopCompanyId} vs User: ${userCompanyId}`);
    });
    console.log('');
    
    console.log('🎯 CONCLUSION:');
    console.log('The user sees JOIN COMMUNITY because the challenge belongs to a different tenant/company.');
    console.log('This is the correct multi-tenant isolation behavior.');
    console.log('To join that challenge, the user would need to join that specific community first.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeJoinProblem();