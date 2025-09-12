// Fix Company Owner Roles - Promote all company owners to ADMIN
const { PrismaClient } = require('@prisma/client');

async function promoteCompanyOwners() {
  const prisma = new PrismaClient();
  
  try {
    console.log('👑 PROMOTING ALL COMPANY OWNERS TO ADMIN ROLE...\n');
    
    // Get all tenants with users
    const tenants = await prisma.tenant.findMany({
      where: {
        whopCompanyId: {
          not: null
        }
      },
      include: {
        users: true
      }
    });
    
    console.log(`Found ${tenants.length} companies with valid company IDs`);
    
    for (const tenant of tenants) {
      console.log(`\n🏢 Processing Company: ${tenant.whopCompanyId} (${tenant.name})`);
      console.log(`   Users in company: ${tenant.users.length}`);
      
      for (const user of tenant.users) {
        console.log(`   👤 User: ${user.email || user.whopUserId} - Current Role: ${user.role}`);
        
        if (user.role !== 'ADMIN') {
          // Promote to ADMIN
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
          });
          console.log(`   ✅ PROMOTED to ADMIN`);
        } else {
          console.log(`   ✅ Already ADMIN`);
        }
      }
    }
    
    console.log('\n📊 FINAL STATUS CHECK:');
    
    // Verify all users are now ADMIN
    const allUpdatedTenants = await prisma.tenant.findMany({
      where: {
        whopCompanyId: {
          not: null
        }
      },
      include: {
        users: true
      }
    });
    
    allUpdatedTenants.forEach(tenant => {
      console.log(`\n🏢 ${tenant.whopCompanyId}:`);
      tenant.users.forEach(user => {
        const status = user.role === 'ADMIN' ? '✅' : '❌';
        console.log(`   ${status} ${user.email || user.whopUserId}: ${user.role}`);
      });
    });
    
    const totalUsers = allUpdatedTenants.reduce((sum, t) => sum + t.users.length, 0);
    const adminUsers = allUpdatedTenants.reduce((sum, t) => sum + t.users.filter(u => u.role === 'ADMIN').length, 0);
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`📊 Total company users: ${totalUsers}`);
    console.log(`👑 Admin users: ${adminUsers}`);
    console.log(`✅ Success rate: ${adminUsers}/${totalUsers} (${Math.round(adminUsers/totalUsers*100)}%)`);
    
    if (adminUsers === totalUsers) {
      console.log('\n🎉 ALL COMPANY OWNERS NOW HAVE ADMIN ACCESS!');
      console.log('✅ They should be able to access the admin panel in Whop');
    } else {
      console.log('\n⚠️  Some users still don\'t have admin access - manual review needed');
    }
    
  } catch (error) {
    console.error('Error promoting users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

promoteCompanyOwners();