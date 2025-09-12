// Database Analysis Script: Check current user data and company IDs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeDatabase() {
  console.log('🔍 Analyzing current database state...\n');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        whopUserId: true,
        whopCompanyId: true,
        experienceId: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            whopCompanyId: true,
            whopHandle: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Total users in database: ${users.length}\n`);
    
    // Analyze fallback company IDs
    const fallbackUsers = users.filter(user => user.whopCompanyId === '9nmw5yleoqldrxf7n48c');
    const validUsers = users.filter(user => user.whopCompanyId !== '9nmw5yleoqldrxf7n48c');
    
    console.log(`🚨 Users with fallback company ID: ${fallbackUsers.length}`);
    console.log(`✅ Users with valid company ID: ${validUsers.length}\n`);
    
    // Show fallback users
    if (fallbackUsers.length > 0) {
      console.log('🔴 FALLBACK COMPANY ID USERS:');
      fallbackUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role})`);
        console.log(`   Whop User ID: ${user.whopUserId}`);
        console.log(`   Company ID: ${user.whopCompanyId} ← FALLBACK!`);
        console.log(`   Experience ID: ${user.experienceId || 'NONE'}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log(`   Tenant: ${user.tenant?.name || 'NO TENANT'}\n`);
      });
    }
    
    // Show valid users
    if (validUsers.length > 0) {
      console.log('✅ VALID COMPANY ID USERS:');
      validUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role})`);
        console.log(`   Whop User ID: ${user.whopUserId}`);
        console.log(`   Company ID: ${user.whopCompanyId}`);
        console.log(`   Experience ID: ${user.experienceId || 'NONE'}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log(`   Tenant: ${user.tenant?.name || 'NO TENANT'}\n`);
      });
    }
    
    // Get tenant statistics
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        whopCompanyId: true,
        whopHandle: true,
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`🏢 Total tenants: ${tenants.length}\n`);
    
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}`);
      console.log(`   Company ID: ${tenant.whopCompanyId}`);
      console.log(`   Handle: ${tenant.whopHandle}`);
      console.log(`   Users: ${tenant._count.users}\n`);
    });
    
    // Summary
    console.log('📈 SUMMARY:');
    console.log(`- Total Users: ${users.length}`);
    console.log(`- Fallback Users: ${fallbackUsers.length} (${((fallbackUsers.length / users.length) * 100).toFixed(1)}%)`);
    console.log(`- Valid Users: ${validUsers.length} (${((validUsers.length / users.length) * 100).toFixed(1)}%)`);
    console.log(`- Total Tenants: ${tenants.length}`);
    
    // Check for specific user
    const specificUser = users.find(user => user.whopUserId === 'user_eGf5vVjIuGLSy');
    if (specificUser) {
      console.log('\n🎯 SPECIFIC USER (user_eGf5vVjIuGLSy):');
      console.log(`   Email: ${specificUser.email}`);
      console.log(`   Role: ${specificUser.role}`);
      console.log(`   Company ID: ${specificUser.whopCompanyId}`);
      console.log(`   Experience ID: ${specificUser.experienceId || 'NONE'}`);
      console.log(`   Tenant: ${specificUser.tenant?.name || 'NO TENANT'}`);
      console.log(`   Is Fallback: ${specificUser.whopCompanyId === '9nmw5yleoqldrxf7n48c' ? 'YES ❌' : 'NO ✅'}`);
    }
    
  } catch (error) {
    console.error('❌ Database analysis error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDatabase();