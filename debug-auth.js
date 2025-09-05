// debug-auth.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAuth() {
  console.log('🔍 Debugging Authentication System...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('ENABLE_DEV_AUTH:', process.env.ENABLE_DEV_AUTH);
  console.log('');

  // Check if we have any users in the database
  console.log('👥 Users in Database:');
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        whopUserId: true,
        whopCompanyId: true,
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      
      // Create a test admin user
      console.log('\n🛠️ Creating test admin user...');
      const testAdmin = await prisma.user.create({
        data: {
          email: 'admin@localhost.com',
          name: 'Test Admin',
          role: 'ADMIN',
          whopUserId: 'user_11HQI5KrNDW1S',
          whopCompanyId: 'biz_YoIIIT73rXwrtK',
        }
      });
      console.log('✅ Test admin created:', testAdmin);
    } else {
      console.log('✅ Found users:');
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - whopCompanyId: ${user.whopCompanyId || 'none'}`);
      });
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }

  await prisma.$disconnect();
}

debugAuth().catch(console.error);
