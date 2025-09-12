#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function debugColleagueDbState() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 DEBUGGING COLLEAGUE DATABASE STATE\n');
    
    // Check all users
    console.log('👥 ALL USERS IN DATABASE:');
    const users = await prisma.user.findMany({
      include: {
        tenant: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Whop User ID: ${user.whopUserId}`);
      console.log(`   Company ID: ${user.whopCompanyId}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Experience ID: ${user.experienceId || 'NULL'}`);
      console.log(`   Tenant: ${user.tenant?.name || 'NULL'} (${user.tenant?.whopCompanyId || 'NULL'})`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Updated: ${user.updatedAt}`);
    });
    
    // Check all tenants
    console.log('\n\n🏢 ALL TENANTS IN DATABASE:');
    const tenants = await prisma.tenant.findMany({
      include: {
        users: true,
        challenges: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    tenants.forEach((tenant, index) => {
      console.log(`\n${index + 1}. Tenant: ${tenant.name}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Company ID: ${tenant.whopCompanyId}`);
      console.log(`   Users: ${tenant.users.length}`);
      console.log(`   Challenges: ${tenant.challenges.length}`);
      console.log(`   Created: ${tenant.createdAt}`);
    });
    
    // Look for the fallback company ID specifically
    console.log('\n\n🚨 CHECKING FOR FALLBACK COMPANY ID:');
    const fallbackCompanyId = '9nmw5yleoqldrxf7n48c';
    
    const usersWithFallback = await prisma.user.findMany({
      where: { whopCompanyId: fallbackCompanyId },
      include: { tenant: true }
    });
    
    console.log(`Users with fallback company ID (${fallbackCompanyId}): ${usersWithFallback.length}`);
    usersWithFallback.forEach(user => {
      console.log(`   - ${user.email} (Role: ${user.role}, Created: ${user.createdAt})`);
    });
    
    const tenantsWithFallback = await prisma.tenant.findMany({
      where: { whopCompanyId: fallbackCompanyId },
      include: { users: true }
    });
    
    console.log(`Tenants with fallback company ID: ${tenantsWithFallback.length}`);
    tenantsWithFallback.forEach(tenant => {
      console.log(`   - ${tenant.name} (Users: ${tenant.users.length})`);
    });
    
    // Check for any recent activity
    console.log('\n\n📅 RECENT DATABASE ACTIVITY (Last 24 hours):');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentUsers = await prisma.user.findMany({
      where: {
        OR: [
          { createdAt: { gte: yesterday } },
          { updatedAt: { gte: yesterday } }
        ]
      },
      include: { tenant: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`Recent user activity: ${recentUsers.length} users`);
    recentUsers.forEach(user => {
      console.log(`   - ${user.email}: Company ${user.whopCompanyId}, Role ${user.role}, Updated ${user.updatedAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugColleagueDbState();