#!/usr/bin/env node
/**
 * 🔍 CHECK CURRENT DATABASE STATE FOR WHOP FLOW
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseState() {
  console.log('🔍 CHECKING CURRENT DATABASE STATE\n');
  
  try {
    // Check all tenants
    console.log('🏗️ TENANTS:');
    const tenants = await prisma.tenant.findMany({
      include: {
        users: true,
        challenges: true
      }
    });
    
    tenants.forEach(tenant => {
      console.log(`   • ${tenant.name} (${tenant.id})`);
      console.log(`     - whopCompanyId: ${tenant.whopCompanyId}`);
      console.log(`     - Users: ${tenant.users.length}`);
      console.log(`     - Challenges: ${tenant.challenges.length}`);
    });

    // Check all users with whop data
    console.log('\n👤 USERS WITH WHOP DATA:');
    const whopUsers = await prisma.user.findMany({
      where: {
        OR: [
          { whopUserId: { not: null } },
          { whopCompanyId: { not: null } }
        ]
      },
      include: {
        tenant: true
      }
    });
    
    whopUsers.forEach(user => {
      console.log(`   • ${user.email} (${user.name})`);
      console.log(`     - Role: ${user.role}`);
      console.log(`     - whopUserId: ${user.whopUserId}`);
      console.log(`     - whopCompanyId: ${user.whopCompanyId}`);
      console.log(`     - Tenant: ${user.tenant?.name} (${user.tenantId})`);
      console.log('');
    });

    // Check for the specific whop user ID
    console.log('🎯 CHECKING SPECIFIC WHOP USER:');
    const specificUser = await prisma.user.findUnique({
      where: { whopUserId: 'user_11HQI5KrNDW1S' },
      include: { tenant: true }
    });
    
    if (specificUser) {
      console.log('✅ Found existing user with whopUserId user_11HQI5KrNDW1S:');
      console.log(JSON.stringify(specificUser, null, 2));
    } else {
      console.log('❌ No user found with whopUserId user_11HQI5KrNDW1S');
    }

    // Access level calculation
    function getAccessLevel(user) {
      if (!user) return 'guest';
      
      if (user.role === 'ADMIN' && user.whopCompanyId) {
        return 'company_owner';
      } else if (user.whopCompanyId) {
        return 'customer';
      } else {
        return 'guest';
      }
    }

    if (specificUser) {
      const accessLevel = getAccessLevel(specificUser);
      console.log(`\n🔐 Access Level for this user: ${accessLevel}`);
      
      if (accessLevel === 'company_owner') {
        console.log('✅ This user CAN access Admin Dashboard');
        console.log('✅ This user CAN create challenges');
      } else {
        console.log('❌ This user CANNOT access Admin Dashboard');
        console.log(`   Reason: Access level is "${accessLevel}", needs "company_owner"`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();
