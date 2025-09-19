const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeUserAdmin() {
  console.log('=== MAKING USER ADMIN ===');
  console.log('');
  
  const whopUserId = 'user_eGf5vVjIuGLSy'; // From Vercel logs
  
  try {
    // Update user to be admin
    const updatedUser = await prisma.user.update({
      where: { whopUserId },
      data: { 
        isAdmin: true,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ SUCCESS: User is now ADMIN!');
    console.log('User ID:', updatedUser.id);
    console.log('Whop User ID:', updatedUser.whopUserId);
    console.log('Is Admin:', updatedUser.isAdmin);
    console.log('Role:', updatedUser.role);
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('');
    console.log('💡 SOLUTION: User needs to be created first');
    console.log('The user probably needs to visit the app once to be created in database');
  }
  
  await prisma.$disconnect();
}

makeUserAdmin();